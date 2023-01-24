const express = require("express");
const logistic = require("../controllers/logistic.controllers");
const router = express.Router();
const auth_owner = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")


router.post('/fetchLogistic',limiter.padrao, auth_owner, logistic.fetchLogistic)
router.post('/fetchLogisticToday', limiter.padrao, auth_owner, logistic.fetchLogisticToday)
module.exports = router;