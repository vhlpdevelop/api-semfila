const express = require("express");
const financeiro = require("../controllers/financeiro.controllers");
const router = express.Router();
const middleware = require("../../middleware/auth.middleware")
const auth_owner = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")


router.post('/changeState',limiter.padrao, middleware, financeiro.changeState)
router.post('/getNFE',limiter.padrao, auth_owner, financeiro.getNFE)
router.get('/fetch',limiter.padrao,middleware, financeiro.fetch)
router.get('/withdrawRequest',limiter.padrao, middleware, financeiro.withdrawRequest)
module.exports = router;