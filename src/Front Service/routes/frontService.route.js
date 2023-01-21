const express = require("express");
const router = express.Router();
const frontService = require("../controllers/frontService.controllers")
const limiter = require("../resources/limiter")
const middleware = require("../../middleware/auth.middleware")
const report = require("../controllers/report.controllers")
//router.get('/fetchCategoria',middleware, categoria.fetchCardapio)
router.get('/getStore/:id',limiter.getStore,frontService.getStore)
router.get('/fetchSearch', limiter.Search_store, frontService.search)
router.use(middleware)
router.post('/menuRating', limiter.padrao, frontService.ratingCardapio)
router.post('/reportCardapio', limiter.report, report.reportCardapio)
module.exports = router;