const express = require("express");
const store = require("../controllers/store.controllers");
const router = express.Router();

const owner_middleware = require("../../middleware/auth.owner.middleware")
const limiter = require("../resources/limiter")
//router.get('/fetchCategoria',middleware, categoria.fetchCardapio)
//router.get('/getStore/:id',limiter.getStore,store.getStore)
router.get('/fetchLoja',limiter.padrao, owner_middleware, store.fetchDadosLoja)
router.post('/updateDadosStore', limiter.padrao,owner_middleware, store.updateDadosStore)
//router.get('/fetchSearch', limiter.Search_store, search.search)
module.exports = router;