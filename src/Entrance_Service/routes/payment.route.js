const express = require("express");
//const middleware = require("../middleware/auth.middleware")
const pagamento = require("../controllers/pagamento.controllers");
const limiter = require("../resources/limiter")
const router = express.Router();
const middleware = require("../../middleware/auth.middleware")
//USERS
//router.post('/fetchSession', middleware,pagamento.startSession);
router.post('/payPix',limiter.padrao,pagamento.payPix);
router.post('/CortesiaPay',limiter.padrao,middleware, pagamento.CortesiaPay);
router.post('/payCreditCard',limiter.padrao,pagamento.payCreditCard);
router.post('/confirmPayment', limiter.padrao, pagamento.confirmPaymentReq);
module.exports = router;