const express = require("express");

const pedido_controller = require("../controllers/pedidos.controllers");
const middleware = require("../../middleware/auth.middleware");
const router = express.Router();
const limiter = require("../resources/limiter")

router.use(middleware)
router.get('/fetchPedidos',limiter.padrao, pedido_controller.fetchPedidos)
router.post('/savePedido', limiter.padrao,pedido_controller.savePedido)
router.post('/updatePedido',limiter.padrao,pedido_controller.updatePedido)
router.post('/deletePedido', limiter.padrao, pedido_controller.deletePedido)
module.exports = router;