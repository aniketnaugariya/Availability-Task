const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const encryptConfig = require('../../../config/encrypt');
const ObjectId = require('mongodb').ObjectID;

const mongoose = require('mongoose');

const Users = mongoose.model('Users');
const validator = require('../../utils/validator');
const Error = require('../../custom/ErrorHandler');
const JWTHelper = require('../../utils/jwt');
const AuthController = {

    signup: async (req, res) => {
        try {
            let { firstName, lastName, email, password, timezoneOffset } = req.body;

            // --- validations ---------------//
            let AddErrors = new Error(400);

            if (!email || !validator.isValidEmail(email)) {
                AddErrors.addRequestError('Invalid email.');
            }
            if (!password || !validator.isValidPassword(password)) {
                AddErrors.addRequestError('Invalid password.');
            }
            if (!firstName || !validator.isValidString(firstName)) {
                AddErrors.addRequestError('Invalid firstName.');
            }
            if (!lastName || !validator.isValidString(lastName)) {
                AddErrors.addRequestError('Invalid lastName.');
            }
            if (!timezoneOffset) {
                timezoneOffset = new Date().getTimezoneOffset();
            }
            if (AddErrors.isErrors()) {
                return res.status(400).json({ success: false, error: AddErrors, message: "Invalid Parameters" });
            }


            email = email.toLowerCase();

            const emailRegex = new RegExp(`^${email.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');
            const findUser = await Users.findOne({ 'email': emailRegex });

            if (findUser && findUser._id && findUser.email) {
                return res.status(400).json({ success: false, message: 'Email is already registered.' });
            }
            // ------------------------------------------- //

            // Convert pass to hash & salt
            const { encrypted, salt } = JWTHelper.saltPassword(password);

            if (timezoneOffset) {
                timezoneOffset = parseInt(timezoneOffset);
            }
            const newUser = new Users({
                firstName,
                lastName,
                email,
                timezoneOffset,
                password: encrypted,
                salt,
                userId : ObjectId()
            });

            // Save User To DB
            let saveUser = await newUser.save();

            if (!saveUser || !saveUser.userId || saveUser.email !== email) {
                return res.status(400).json({ success: false, error: new TaError(OK).addParamError('Unable to register user.'), message: 'Unable to register user.' });
            }

            // Create token with 100Days of Expiration.
            const token = jwt.sign(
                { userId: saveUser.id, email: saveUser.email },
                encryptConfig.secret,
                { expiresIn: "100d" }
            );

            delete saveUser.password;
            delete saveUser.salt;
            delete saveUser.emailHash;
            delete saveUser.encrypted;
            delete saveUser._id;

            return res.status(200).json({
                success: true,
                message: "success",
                token,
                userId: saveUser.userId,
                newUser: true
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error });
        }
    },

    login: async (req, res) => {
        try {
            let { email, password } = req.body;

            let AddErrors = new Error(400);

            if (!email || !validator.isValidEmail(email)) {
                AddErrors.addRequestError('Invalid Email.');
            }
            if (!password || !validator.isValidPassword(password)) {
                AddErrors.addRequestError('Invalid Password.');
            }
            if (AddErrors.isErrors()) {
                return res.status(400).json({ success: false, error: AddErrors, message: "Invalid Parameters" });
            }

            email = email.toLowerCase();

            // Look in database for user
            let findUser = await Users.findOne({ 'email': email });

            // Check if valid user returned, return error if needed
            if (!findUser || !findUser.id) {
                return res.status(400).json({ success: false, message: "Invalid username/password." });
            }

            // HASH and SALT password, compare to database password
            const decryptedPass = await JWTHelper.decryptPassword(password, findUser.salt);

            if (decryptedPass !== findUser.password) {
                return res.status(400).json({ success: false, error: error });
            }

            const token = jwt.sign(
                {
                    userId: findUser.id,
                    email: findUser.email,
                    company: findUser.company,
                    firstName: findUser.firstName,
                    lastName: findUser.lastName,

                },
                encryptConfig.secret,
                { expiresIn: "100d" }
            );
            return res.status(200).json({
                success: true,
                token,
                userId: findUser.userId,
            });
        }
        catch (error) {
            console.log('login error:', error);
            return res.status(500).json({ success: false, error: error });
        }
    },
}

module.exports = AuthController;