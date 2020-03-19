// const crypto = require('crypto');
// const jwt = require('jsonwebtoken');
const checkJWT = require('../../utils/jwt');
const encryptConfig = require('../../../config/encrypt');
const ObjectId = require('mongodb').ObjectID;

const mongoose = require('mongoose');

const Users = mongoose.model('Users');
const Availability = mongoose.model('Availability');
const validator = require('../../utils/validator');
const Error = require('../../custom/ErrorHandler');
const AvailabilityHelper = require('../../utils/availability.helper');

const AvailabilityController = {

    addAvailability: async (req, res) => {
        try {
            const { startTime, endTime } = req.body;

            let AddErrors = new Error(400);
            if (!req.currentUser) {
                AddErrors.addRequestError('Invalid user');
            }
            if (!startTime) {
                AddErrors.addRequestError('Invalid startTime');
            }
            if (!endTime) {
                AddErrors.addRequestError('Invalid endTime');
            }
            if (AddErrors.isErrors()) {
                return res.status(400).json({ success: false, error: AddErrors, message: "Invalid Parameters" });
            }

            let availability = new Availability();
            availability.startTime = parseInt(startTime);
            availability.endTime = parseInt(endTime);
            availability.userId = req.currentUser.userId; //req.body.userId;

            let saveAvailability = await availability.save();
            if (saveAvailability) {
                console.log('availability saved:', saveAvailability);
                return res.status(200).json({ success: true, response: 'Availability saved successfully' });
            } else {
                return res.status(400).json({ success: false, response: 'Unable to save Availability' });
            }
        }
        catch (error) {
            console.log('error:', error);
            return res.status(500).json({ success: false, error: error });
        }
    },

    getAvailability: async (req, res) => {
        try {

            let AddErrors = new Error(400);
            if (!req.query.userId) {
                AddErrors.addRequestError('Invalid user');
            }
            if (AddErrors.isErrors()) {
                return res.status(400).json({ success: false, error: AddErrors, message: "Invalid Parameters" });
            }
            if (!req.query.timeOffset) {
                req.query.timeOffset = new Date().getTimezoneOffset();
            }

            const UserDetails = await Users.findOne({userId: ObjectId(req.query.userId)});
            let result = await AvailabilityHelper.availabilityLogic(req.query.userId);
            console.log(result);

            // day wise availability split 
            let availability = [];  
            result.map((doc) => {  // get availability according to user time zone
                availability.push({
                    Name: `${UserDetails.firstname} ${UserDetails.lastname}`,
                    startTime: checkJWT.getuserTimeStamp(doc.startTime, req.query.timeOffset),
                    endTime: checkJWT.getuserTimeStamp(doc.endTime, req.query.timeOffset)
                })
            })


            let finalArray = [];
            availability.map((doc) => {  // check availability if it falls under two different date
                if (new Date(doc.startTime).getDate() !== new Date(doc.endTime).getDate()) { 
                    // check if day difference is not more than 24 hours
                    // let dayDiff = parseInt((new Date(availability[i].startTime) - new Date(availability[i].endTime)) / (1000 * 60 * 60 * 24), 10);
                    // split record upto two records 1st for previous date and 2nd for next date
                    finalArray.push({
                        Name: `${UserDetails.firstname} ${UserDetails.lastname}`,
                        date: new Date(doc.startTime).toLocaleDateString(),
                        startTime: new Date(doc.startTime).toLocaleTimeString(),
                        endTime: new Date(new Date(doc.startTime).setHours(23, 59, 59, 59)).toLocaleTimeString()
                    })
                    finalArray.push({
                        Name: `${UserDetails.firstname} ${UserDetails.lastname}`,
                        date: new Date(doc.endTime).toLocaleDateString(),
                        startTime: new Date(new Date(doc.endTime).setHours(0, 0, 0, 0)).toLocaleTimeString(),
                        endTime: new Date(doc.endTime).toLocaleTimeString()
                    })
                } else { 
                    finalArray.push({
                        Name: `${UserDetails.firstname} ${UserDetails.lastname}`,
                        date: new Date(doc.startTime).toLocaleDateString(),
                        startTime: new Date(doc.startTime).toLocaleTimeString(),
                        endTime: new Date(doc.endTime).toLocaleTimeString()
                    })
                }
            })

            return res.status(200).render('AvailabilityList.html', { result: finalArray });

        } catch (error) {
            console.log('error:', error);
            return res.status(500).json({ success: false, error: error });
        }
    }

}

module.exports = AvailabilityController;