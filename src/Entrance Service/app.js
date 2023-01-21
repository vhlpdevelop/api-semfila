const bodyParser = require("body-parser");
const db = require("./config/db");
const cors = require("cors");
const helmet = require('helmet')
const mongoSanitize = require("express-mongo-sanitize")
//
const fs = require("fs");
const path = require('path');
//
const { Server } = require("socket.io");
const app = require("express")();

var server = require('http').createServer(app)
const globalUsers = require("./resources/traficBus");
const PORT = 443;
require("dotenv").config()
const {createWebhook} = require('./config/gerenciaNet.config')
/*
const httpsOptions = {
  cert: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/fullchain.pem'), // Certificado fullchain do dominio
  key: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/privkey.pem'), // Chave privada do domínio
  ca: fs.readFileSync(path.resolve(__dirname, `./certs/${process.env.GN_WEBHOOK}`)), // Certificado público da Gerencianet
  minVersion: "TLSv1.2",
  requestCert: true,
  rejectUnauthorized: false, //Mantenha como false para que os demais endpoints da API não rejeitem requisições sem MTLS
};
*/
app.use(cors());
app.use(helmet());
app.use(mongoSanitize())
app.disable('x-powered-by')
//var server = require("https").createServer(httpsOptions, app);
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

const io = require("socket.io")(server, {
  cors: {
    origins: [],
  },
});

server.listen(ENTRANCE_PORT, () => {
  console.log(`Servidor rodando na porta ${ENTRANCE_PORT}`);
  createWebhook().then((output) => {
    
    console.log('webhook created. not')//,output)
  })

});

//WEBSOCKET
const crypto = require("crypto")
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  
  if (sessionID) {
    // find existing session
    
   
      socket.sessionID = sessionID;
      
      return next();
    
  }


  // create new session
  socket.sessionID = crypto.randomBytes(16).toString("hex");
  
  next();
});
io.sockets.on("connection", (socket) => { //Caso usuario não receba qrcode devera verificar no array
  socket.emit("session", {
    sessionID: socket.sessionID,
  });
  socket.join(socket.sessionID) //Insere o socket no server
  console.log(socket.sessionID)
  let index = globalUsers.findIndex(function (user) {
    return user.sessionID === socket.sessionID;
  });
  console.log(globalUsers)
  if(index > -1){
   
   
    //Como nao recebi qrcode, reenviar.
    let aux = {
      index: index,
      sessionID: globalUsers[index].sessionID,
      dataToSave: globalUsers[index].dataToSave
    }
    
    QrCodeReSend(aux,io)
  }
});
app.set("socketio", io);


