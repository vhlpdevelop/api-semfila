const express = require("express");
const financeiro = require("../controllers/financeiro.controllers");
const router = express.Router();

const auth_owner = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")


router.post('/changeState',limiter.padrao, auth_owner, financeiro.changeState)
router.post('/getNFE',limiter.padrao, auth_owner, financeiro.getNFE)
router.post('/fetchFinanceiroToday',limiter.padrao,auth_owner, financeiro.fetchFinanceiroToday)
router.post('/fetchFinanceiro',limiter.padrao,auth_owner, financeiro.fetchFinanceiro)
router.post('/reembolsoAction', limiter.padrao, auth_owner, financeiro.reembolsoAction)
router.post('/dataFinanceiro', limiter.padrao, auth_owner, financeiro.dataFinanceiro)
router.get('/withdrawRequest',limiter.padrao, auth_owner, financeiro.withdrawRequest)


module.exports = router;