const express = require("express");
const financeiro = require("../controllers/financeiro.controllers");
const router = express.Router();

const auth_owner = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")


router.post('/changeState',limiter.padrao, auth_owner, financeiro.changeState)
router.post('/getNFE',limiter.padrao, auth_owner, financeiro.getNFE)
router.get('/fetch',limiter.padrao,auth_owner, financeiro.fetch)
router.get('/withdrawRequest',limiter.padrao, auth_owner, financeiro.withdrawRequest)
module.exports = router;