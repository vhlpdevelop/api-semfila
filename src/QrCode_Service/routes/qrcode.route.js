const express = require("express");
const middleware = require("../../middleware/auth.middleware")
const qrCode = require("../controllers/qrCode.controllers");
const limiter = require("../resources/limiter")
const router = express.Router();

router.post('/refreshSingleQrCode', limiter.padrao, qrCode.refreshSingleQrCode)
router.post('/requestWithdraw', limiter.padrao, qrCode.requestWithDraw)
router.post('/recoverQrCode', limiter.Login_limiter, qrCode.recoverQrCode)
router.post('/qrCodeTicketUpdate', limiter.padrao, qrCode.qrCodeTicketUpdate)
router.use(middleware)
router.post('/refreshQrCodeUser', limiter.padrao,qrCode.refreshQrCodes)
router.post('/fetchQrCodesEmp', limiter.padrao,qrCode.fetchQrCodesEmp)
router.post('/updateQrCodeOptionalName', limiter.padrao, qrCode.updateQrCodeOptionalName)
router.post('/generateQrCode', limiter.padrao,qrCode.generateQrCode)
router.post('/fetch', limiter.padrao,qrCode.fetchQrCode)
router.post('/update',limiter.padrao,qrCode.updateQrCode)
router.post('/delete', limiter.padrao,qrCode.deleteQrCode)
module.exports = router;