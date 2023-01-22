const express = require("express");
const controller = require("../controllers/admin.controller");
const router = express.Router();
const middleware = require("../../middleware/auth.admin.middleware")


router.post('/fetchEmpresas',middleware, controller.fetchEmpresas)
router.post('/fetchStoreFromEmpresa',middleware, controller.fetchStoreFromEmpresa)

router.post('/fetchEmpresaUser',middleware, controller.fetchEmpresaUser)
router.post('/fetchNewEmpresas',middleware, controller.fetchNewEmpresas)
router.post('/fetchPedido',middleware, controller.fetchPedido)
router.post('/fetchEmpresa', middleware, controller.fetchEmpresa)

router.post('/fetchDrawReqData', middleware, controller.fetchDrawReqData)
router.post('/fetchDrawReqAll', middleware, controller.fetchDrawReqAll)
router.post('/fetchDrawRequestsEmp', middleware, controller.fetchDrawRequestsEmp)
router.post('/fetchDrawRequests', middleware,controller.fetchDrawRequests)
router.post('/authenticateDraw', middleware,controller.authenticateDraw)
router.post('/authenticateEmpresa', middleware, controller.authenticateEmpresa)

//user
router.post("/fetchUserId", middleware, controller.fetchUserId)
router.post("/fetchUserEmail", middleware, controller.fetchUserEmail)
router.post("/UserData", middleware, controller.UserData)
router.post("/RequestPasswordChangeUser", middleware, controller.RequestPasswordChangeUser)

//Store
router.post('/storeSwitchOnOff', middleware, controller.storeSwitchOnOff)

//reembolso
router.post("/fetchReembolso",middleware, controller.fetchReembolso)
router.post("/fetchReembolsoOne",middleware, controller.fetchReembolsoOne)

//pedido
router.post("/fetchPedidos",middleware, controller.fetchPedidos)
router.post("/fetchTxid", middleware, controller.fetchTxid)

//Estorno
router.post("/withDrawAction", middleware, controller.withDrawAction)

//reports
router.get("/getReports", middleware, controller.getReports)
router.post("/sendEmailAnalisys", middleware, controller.sendEmailAnalisys)
router.post("/SendEmailEmpresa", middleware, controller.SendEmailEmpresa)
router.post("/deleteReport", middleware, controller.deleteReport)
module.exports = router;