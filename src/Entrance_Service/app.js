const bodyParser = require("body-parser");
const db = require("./config/db");
const cors = require("cors");
const helmet = require('helmet')
const mongoSanitize = require("express-mongo-sanitize")
const app = require("express")();

require("dotenv").config()

app.use(cors());
app.use(helmet());
app.use(mongoSanitize())
app.disable('x-powered-by')

app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
const {
  ENTRANCE_PORT,

} = process.env

db.on("open", () => {
  console.log("Conectado ao mongo pelo ENTRANCE SERVICE! ");
});
db.on("error", (err) => {
  console.log(err);
});
app.listen(ENTRANCE_PORT, () => {
  console.log(`ENTRACE SERVICE rodando na porta ${ENTRANCE_PORT}`);
})
//Pagamentos
const payment = require("./routes/payment.route");

app.use("/", payment);



