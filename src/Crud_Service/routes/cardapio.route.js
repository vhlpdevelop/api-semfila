const express = require("express");
const cardapio = require("../controllers/cardapio.controllers");
const router = express.Router();
const middleware = require("../../middleware/auth.middleware")
const limiter = require("../resources/limiter")

router.get('/fetchCardapio',limiter.padrao,middleware, cardapio.fetchCardapio)
router.post('/updateItemStatus',limiter.padrao,middleware,cardapio.updateItemStatus)
router.post('/updateCategoryStatus',limiter.padrao, middleware, cardapio.updateCategoryStatus)
router.use(middleware)
router.post('/menuRating', limiter.padrao, cardapio.ratingCardapio)
module.exports = router;