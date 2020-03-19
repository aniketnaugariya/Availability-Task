const { Router } = require("express");
const router = Router();
const JWT = require('../utils/jwt');
const AvailabilityController  =  require("../controller/version1/availability.controller");
router.post("/addAvailability", JWT.decryptApiKey, AvailabilityController.addAvailability);

router.get("/getAvailability", JWT.decryptApiKey, AvailabilityController.getAvailability);
module.exports = router;