const encryptConfig = require('../../config/encrypt');

// Libraries
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Mongoose
const mongoose = require('mongoose');

const Users = mongoose.model('Users');

const JWT = {
    decryptApiKey: async (req, res, next) => {
        try {
            const { authorization } = req.headers;
            if (!authorization || authorization === 'null') {
                req.currentUser = null;
                return next();
            }

            const decodedKey = await jwt.verify(authorization, encryptConfig.secret);
            if (typeof decodedKey === 'undefined' || typeof decodedKey.userId === 'undefined') {
                req.currentUser = null;
                return next();
            }

            const { userId } = decodedKey;
            const user = await Users.findOne({
                _id: userId
            });

            if (!user || !user._id) {
                req.currentUser = null;
                return next();
            }

            req.currentUser = user;

            return next();
        } catch (e) {
            console.log('decrypt API e:', e);
            req.currentUser = null;
            return next();
        }
    },

    makeSalt: function makeSalt() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },

    saltPassword: (password) => {
        if (!password) {
            return {
                encrypt: '',
                salt: '',
            };
        }

        const salt = JWT.makeSalt();

        const encrypted = crypto
            .createHmac('sha1', salt)
            .update(password)
            .digest('hex');

        return { encrypted, salt };
    },

    decryptPassword: (password, salt) => {
        if (!password || !salt) {
            return false;
        }

        const decrypted = crypto
            .createHmac('sha1', salt)
            .update(password)
            .digest('hex');

        return decrypted;
    }
};

module.exports = JWT;
