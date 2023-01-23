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
    ADMIN_PORT,

} = process.env

app.listen(ADMIN_PORT, () => {
  console.log(`ADMIN SERVICE rodando na porta ${ADMIN_PORT}`);
})
db.on("open", () => {
  console.log("Conectado ao mongo pelo ADMIN SERVICE! ");
});
db.on("error", (err) => {
  console.log(err);
});
const admin = require('./routes/admin.route')

app.use("/", admin)
