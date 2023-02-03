const bodyParser = require("body-parser");
const db = require("./config/db")
const cors = require("cors");
const helmet = require('helmet')
const mongoSanitize = require("express-mongo-sanitize")
require("dotenv").config()
const app = require("express")();
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(mongoSanitize())
app.disable('x-powered-by')
app.use(bodyParser.json({limit: '30mb'}));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const {
    CRUD_PORT,
} = process.env

app.listen(CRUD_PORT, () => {
  console.log(`CRUD rodando na porta ${CRUD_PORT}`);
})
db.on("open", () => {
  console.log("Conectado ao mongo pelo CRUD SERVICE! ");
});
db.on("error", (err) => {
  console.log(err);
});


app.get('/teste', (req,res) => {
  return res.send('funfou!')
})

//cardapio
const cardapio = require("./routes/cardapio.route");
app.use("/cardapio", cardapio);
//Categoria
const categoria = require("./routes/categoria.route");
app.use("/categoria", categoria);

//ITEM
const item = require("./routes/item.route");
app.use("/item", item);

//Store
const store = require("./routes/store.route");
app.use("/store", store);

//Pedidos
const pedido = require("./routes/pedidos.route");
app.use("/pedidos", pedido);

//Logistica
const logistic = require("./routes/logistic.route");
app.use("/logistic", logistic);

//Financeiro
const financeiro = require("./routes/financeiro.route")
app.use("/financeiro", financeiro)

//Limiter
const limiter = require("./routes/limiter.route");
app.use("/limiter", limiter)