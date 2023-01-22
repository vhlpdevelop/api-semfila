const express = require("express");
const categoria = require("../controllers/categoria.controllers");
const router = express.Router();
const middleware = require("../../middleware/auth.middleware")
const limiter = require("../resources/limiter")

router.post('/updateCategoria',limiter.padrao,middleware,categoria.updateCategoria)
router.post('/deleteCategoria',limiter.padrao, middleware, categoria.deleteCategoria)
router.post('/newCategoria',limiter.padrao, middleware, categoria.newCategoria)
module.exports = router;