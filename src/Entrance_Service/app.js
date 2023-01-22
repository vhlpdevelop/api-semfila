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

app.use(bodyParser.json({limit: '30mb'}));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
const {
  ENTRANCE_PORT,

} = process.env

db.on("open", () => {
  console.log("Conectado ao mongo pelo ENTRANCE SERVICE! ");
});
db.on("error", (err) => {
  console.log(err);
});

//Pagamentos
const { QrcodeReturner, QrCodeReSend } = require ( "./controllers/pagamento.controllers");
const payment = require("./routes/payment.route");

app.use("/payment", payment);




app.post("/webhook", (request, response) => {
  // Verifica se a requisição que chegou nesse endpoint foi autorizada
  console.log("Entrou aqui 1")
  if (request.client.authorized) { 
      response.status(200).end();
  } else {
      response.status(401).end();
  }
});

app.post("/webhook/pix*", (req, res) => {
  console.log("WEB HOOK RECEBIDO ")
  
  const {pix} = req.body
  if (!req.client.authorized) {
    return res.status(401).send('Invalid client certificate.');
  }
  if(pix){
    console.log("Foi pago e entrou aqui")
    for (const order of pix) {
      let aux = {
        object: order.txid
      }
      req.aux = aux
      QrcodeReturner(req)
    }
  }
  res.send({ ok: 1 })
});




