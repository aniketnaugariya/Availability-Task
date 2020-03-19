const mongoose = require('mongoose');
const Availability = mongoose.model('Availability');

const helper = {
    availabilities : async (userId)=> {
        // Get Availability ------------------//
        let AvailabilityList = await Availability.find({ userId: userId }).sort({ startTime: 1 });
        // -----------------------------------//
        let AvailabilityListOfUser = AvailabilityList;
        let timeFrame = [];
        if (AvailabilityList.length > 1) {
            timeFrame.push(AvailabilityList.length);
            // Merge Availability with their startTime and endTime ---//
            AvailabilityListOfUser = await helper.iterations(AvailabilityList);
            // -------------------------------------------------------//
            timeFrame.push(AvailabilityListOfUser.length);
            // Further Merging of Availabilities ---------------------//
            while (AvailabilityListOfUser.length > 1 && (timeFrame[timeFrame.length - 1] != timeFrame[timeFrame.length - 2])) {
    
                AvailabilityListOfUser = await helper.iterations(AvailabilityListOfUser);
                timeFrame.push(AvailabilityListOfUser.length);
            }
        } else {
            AvailabilityListOfUser = AvailabilityList;
        }
        return AvailabilityListOfUser;
    },

    iterations : async (list) => {
        let time = []
    
        for (let i = 0; i < (list.length - 1); i+=1) {
    //if startTime of availability 2nd come under 1st availability time frame(startTime and endTime) and endTime of 2nd availability is less then endTime of 1st availability
            if (list[i].startTime <= list[i + 1].startTime && list[i].endTime >= list[i + 1].startTime && list[i].endTime >= list[i + 1].endTime) {
                time.push({ startTime: list[i].startTime, endTime: list[i].endTime });
                 // remove the 2nd availability from array
                list.splice(i + 1, 1);
                //-------------------------------
                if ((list.length - 1) == i + 1) { 
                    time.push({ startTime: list[i + 1].startTime, endTime: list[i + 1].endTime });
                    break;
                }
                if (list.length <= 2) {
                    if (list.length < 2 || (list.length - 1 == i)) break;
                    time.push({ startTime: list[list.length - 1].startTime,  endTime: list[list.length - 1].endTime  })
                }
            //If startTime of availability 2nd comes under 1st availability time frame(startTime and endTime) and endTime of 2nd availability > endTime of 1st availability
            } else if (list[i].startTime <= list[i + 1].startTime && list[i].endTime >= list[i + 1].startTime) {
                
                time.push({ startTime: list[i].startTime, endTime: list[i + 1].endTime });
    
                 // remove the 2nd availability from array
                list.splice(i + 1, 1);
                if ((list.length - 1) == i + 1) {
                    time.push({ startTime: list[i + 1].startTime, endTime: list[i + 1].endTime })
                    break;
                }
                if (list.length <= 2) {
                    if (list.length < 2 || (list.length - 1 == i)) break;
                    time.push({ startTime: list[list.length - 1].startTime, endTime: list[list.length - 1].endTime })
                }
            } else {
                if (list.length == i + 2) {
                    time.push({ startTime: list[i].startTime, endTime: list[i].endTime  })
                    time.push({ startTime: list[i + 1].startTime, endTime: list[i + 1].endTime })
                } else {
                    time.push({ startTime: list[i].startTime, endTime: list[i].endTime  })
                }
    
            }
        }
        return time
    },

// for previous time
    getUserPreviousTime: (timestamp, userTimezoneOffset) => {
        let serverTimeOffset = new Date(timestamp).getTimezoneOffset(); // ser offset
        var utc = new Date(timestamp).getTime() + (serverTimeOffset * 60000); // 300 offset
        return (utc - ((60 * 1000) * parseInt(userTimezoneOffset)));
    },
}

module.exports = helper;