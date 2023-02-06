const express = require("express");
const limiter_controller = require("../controllers/limiter.controllers");
const router = express.Router();
const auth_owner = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")
router.post('/switchLimit', limiter.padrao, auth_owner, limiter_controller.switchLimit)
router.post('/updateLimit', limiter.padrao, auth_owner, limiter_controller.updateLimit)
router.post('/limitHistoric', limiter.padrao, auth_owner, limiter_controller.fetchHistoricoLimit)
module.exports = router;