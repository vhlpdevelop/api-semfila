const express = require("express");
const middleware = require("../../middleware/auth.middleware")
const qrCode = require("../controllers/qrCode.controllers");
const limiter = require("../resources/limiter")
const router = express.Router();

router.post('/refreshSingleQrCode', limiter.padrao, qrCode.refreshSingleQrCode)
router.post('/requestWithdraw', limiter.padrao, qrCode.requestWithDraw)
router.post('/recoverQrCode', limiter.Login_limiter, qrCode.recoverQrCode)
router.use(middleware)
router.post('/refreshQrCodeUser', limiter.padrao,qrCode.refreshQrCodes)
router.get('/fetchQrCodesEmp', limiter.padrao,qrCode.fetchQrCodesEmp)
router.post('/fetch', limiter.padrao,qrCode.fetchQrCode)
router.post('/update',limiter.padrao,qrCode.updateQrCode)
router.post('/delete', limiter.padrao,qrCode.deleteQrCode)
module.exports = router;