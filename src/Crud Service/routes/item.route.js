const express = require("express");
const items = require("../controllers/items.controllers");
const router = express.Router();
const middleware = require("../../middleware/auth.middleware")
const limiter = require("../resources/limiter")

//router.get('/fetchCategoria',middleware, categoria.fetchCardapio)
router.post('/updateItem',limiter.padrao,middleware,items.updateItem)
router.post('/deleteItem', limiter.padrao,middleware, items.deleteItem)
router.post('/newItem',limiter.padrao, middleware, items.newItem)
module.exports = router;