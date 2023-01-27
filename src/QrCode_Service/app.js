const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require('helmet')
const db = require("./config/db")
const mongoSanitize = require("express-mongo-sanitize")
require("dotenv").config()
const app = require("express")();
app.use(cors());
app.use(helmet());
app.use(mongoSanitize())
app.disable('x-powered-by')
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));
const {
    QRCODE_PORT,
} = process.env

app.listen(QRCODE_PORT, () => {
  console.log(`QRCODE SERVICE rodando na porta ${QRCODE_PORT}`);

})
db.on("open", () => {
  console.log("Conectado ao mongo pelo QRCODE SERVICE! ");
});
db.on("error", (err) => {
  console.log(err);
});
const qrcode = require('./routes/qrcode.route')
app.use("/", qrcode)
