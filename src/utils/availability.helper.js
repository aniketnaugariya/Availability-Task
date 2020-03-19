const mongoose = require('mongoose');
const Availability = mongoose.model('Availability');

const helper = {
    availabilityLogic : async (userId)=> {
        let AvailabilityList = await Availability.find({ userId: userId }).sort({ startTime: 1 });
        let result = AvailabilityList;
        let timeFrame = [];
        if (AvailabilityList.length > 1) {
            timeFrame.push(AvailabilityList.length);
            result = await helper.iterations(AvailabilityList);
            timeFrame.push(result.length);
            while (result.length > 1 && (timeFrame[timeFrame.length - 1] != timeFrame[timeFrame.length - 2])) {
    
                result = await helper.iterations(result);
                timeFrame.push(result.length);
    
            }
        } else {
            result = AvailabilityList;
        }
        console.log('result:', result)
    
        return result;
    },
    iterations : async (data) => {
        let time = []
    
        for (let i = 0; i < (data.length - 1); i+=1) {

            if (data[i].startTime <= data[i + 1].startTime && data[i].endTime >= data[i + 1].startTime && data[i].endTime >= data[i + 1].endTime) {
    
 
                time.push({ startTime: data[i].startTime, endTime: data[i].endTime });
    
                data.splice(i + 1, 1);
                if ((data.length - 1) == i + 1) { 
                    time.push({ startTime: data[i + 1].startTime, endTime: data[i + 1].endTime });
                    break;
                }
                if (data.length <= 2) {
                    if (data.length < 2 || (data.length - 1 == i)) break;
                    time.push({ startTime: data[data.length - 1].startTime,  endTime: data[data.length - 1].endTime  })
                }

            } else if (data[i].startTime <= data[i + 1].startTime && data[i].endTime >= data[i + 1].startTime) {
    
                // comming in time frame 
                time.push({ startTime: data[i].startTime, endTime: data[i + 1].endTime });
    
                 // remove the next record from array
                data.splice(i + 1, 1);
                if ((data.length - 1) == i + 1) {
                    time.push({ startTime: data[i + 1].startTime, endTime: data[i + 1].endTime })
                    break;
                }
                if (data.length <= 2) {
                    if (data.length < 2 || (data.length - 1 == i)) break;
                    time.push({ startTime: data[data.length - 1].startTime, endTime: data[data.length - 1].endTime })
                }
            } else {
                if (data.length == i + 2) {
                    time.push({ startTime: data[i].startTime, endTime: data[i].endTime  })
                    time.push({ startTime: data[i + 1].startTime, endTime: data[i + 1].endTime })
                } else {
                    time.push({ startTime: data[i].startTime, endTime: data[i].endTime  })
                }
    
            }
        }
        return time
    }
}

module.exports = helper;