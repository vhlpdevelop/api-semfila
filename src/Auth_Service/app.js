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
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

const {
    LOGIN_PORT,
} = process.env

app.listen(LOGIN_PORT, () => {
  console.log(`AUTH rodando na porta ${LOGIN_PORT}`);
})
db.on("open", () => {
  console.log("Conectado ao mongo pelo AUTH SERVICE! ");
});
db.on("error", (err) => {
  console.log(err);
});

const login = require('./routes/auth.route')
app.use("/", login)
