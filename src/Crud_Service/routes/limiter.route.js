const express = require("express");
const limiter_controller = require("../controllers/limiter.controllers");
const router = express.Router();
const auth_owner = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")


router.post('/createLimit',limiter.padrao, auth_owner,limiter_controller.createLimit )
router.post('/switchLimit', limiter.padrao, auth_owner, limiter_controller.switchLimit)
router.post('/updateLimit', limiter.padrao, auth_owner, limiter_controller.updateLimit)
module.exports = router;