
const ObjectId = require('mongodb').ObjectID;

const mongoose = require('mongoose');

const Users = mongoose.model('Users');
const Availability = mongoose.model('Availability');
const Error = require('../../custom/ErrorHandler');
const AvailabilityHelper = require('../../utils/availability.helper');

const AvailabilityController = {

    addAvailability: async (req, res) => {
        try {
            const { startTime, endTime } = req.body;
            // Validation -----------------//
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
            // ---------------------------------------- //

            // Save Availability to DB ----------------//
            let availability = new Availability();
            availability.startTime = parseInt(startTime);
            availability.endTime = parseInt(endTime);
            availability.userId = req.currentUser.userId;

            let saveAvailability = await availability.save();
            // -----------------------------------------//
            if (saveAvailability) {
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
            // ----- Validations ------------//
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
            // -----------------------------------//
            // Find User Details ---------------- //
            const UserDetails = await Users.findOne({userId: ObjectId(req.query.userId)});
            // -----------------------------------//

            // Get Availability List of The User with browser timings ---//
            let availabilityResult = await AvailabilityHelper.availabilities(req.query.userId);

            // day wise availability split 
            let availability = [];
            availabilityResult.map((doc) => {  // get availability according to user time zone
                availability.push({
                    Name: `${UserDetails.firstName} ${UserDetails.lastName}`,
                    startTime: AvailabilityHelper.getUserPreviousTime(doc.startTime, req.query.timeOffset),
                    endTime: AvailabilityHelper.getUserPreviousTime(doc.endTime, req.query.timeOffset)
                })
            })


            let AvailabilityListOfUser = [];
            availability.map((doc) => {  // check availability if it falls under two different date
                if (new Date(doc.startTime).getDate() !== new Date(doc.endTime).getDate()) { 
                    AvailabilityListOfUser.push({
                        Name: `${UserDetails.firstName} ${UserDetails.lastName}`,
                        date: new Date(doc.startTime).toLocaleDateString(),
                        startTime: new Date(doc.startTime).toLocaleTimeString(),
                        endTime: new Date(new Date(doc.startTime).setHours(23, 59, 59, 59)).toLocaleTimeString()
                    })
                    AvailabilityListOfUser.push({
                        Name: `${UserDetails.firstName} ${UserDetails.lastName}`,
                        date: new Date(doc.endTime).toLocaleDateString(),
                        startTime: new Date(new Date(doc.endTime).setHours(0, 0, 0, 0)).toLocaleTimeString(),
                        endTime: new Date(doc.endTime).toLocaleTimeString()
                    })
                } else { 
                    AvailabilityListOfUser.push({
                        Name: `${UserDetails.firstName} ${UserDetails.lastName}`,
                        date: new Date(doc.startTime).toLocaleDateString(),
                        startTime: new Date(doc.startTime).toLocaleTimeString(),
                        endTime: new Date(doc.endTime).toLocaleTimeString()
                    })
                }
            })

            return res.status(200).render('AvailabilityList.html', { result: AvailabilityListOfUser });

        } catch (error) {
            console.log('error:', error);
            return res.status(500).json({ success: false, error: error });
        }
    }

}

module.exports = AvailabilityController;