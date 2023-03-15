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
    FRONT_PORT,

} = process.env

app.listen(FRONT_PORT, () => {
  console.log(`Front rodando na porta ${FRONT_PORT}`);
})
db.on("open", () => {
  console.log("Conectado ao mongo pelo FRONT! ");
});
db.on("error", (err) => {
  console.log(err);
});
const setCache = function (req, res, next){
  const period = 60*2;
  if(req.method == "POST"  || req.method == "GET"){
    res.set("Cache-control", `public, max-age=${period}`);
  }else{
    res.set("Cache-control", `no-store`);
  }
  next();
}
app.use(setCache)
const front = require('./routes/frontService.route')
app.use("/", front)

