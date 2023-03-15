const express = require('express');
const httpProxy = require('express-http-proxy');
const app = express();
require("dotenv").config()
const globalUsers = require("./resources/traficBus");
const {createWebhook} = require('./config/gerenciaNet.config')
const fs = require("fs");
const path = require('path');
const bodyParser = require("body-parser");
const db = require("./config/db");
const cors = require("cors");


const helmet = require('helmet')
const mongoSanitize = require("express-mongo-sanitize")
const httpsOptions = {
  cert: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/fullchain.pem'), // Certificado fullchain do dominio
  key: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/privkey.pem'), // Chave privada do domínio
  ca: fs.readFileSync(path.resolve(__dirname, `./config/certs/${process.env.GN_WEBHOOK}`)), // Certificado público da Gerencianet
  minVersion: "TLSv1.2",
  requestCert: true,
  rejectUnauthorized: false, //Mantenha como false para que os demais endpoints da API não rejeitem requisições sem MTLS
};
const port = 443;
app.use(cors());
app.use(helmet());
app.use(mongoSanitize())
app.disable('x-powered-by')
app.use(bodyParser.json({ limit: '30mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '30mb' }));
var server = require("https").createServer(httpsOptions, app);
const {
  ADMIN_PORT,
  FRONT_PORT,
  LOGIN_PORT,
  QRCODE_PORT,
  CRUD_PORT,
  ENTRANCE_PORT
} = process.env;

const AdminServiceProxy = httpProxy('http://localhost:'+ADMIN_PORT);
const FrontServiceProxy = httpProxy('http://localhost:'+FRONT_PORT);
const LoginServiceProxy = httpProxy('http://localhost:'+LOGIN_PORT);
const QrCodeServiceProxy = httpProxy('http://localhost:'+QRCODE_PORT);
const CrudServiceProxy = httpProxy('http://localhost:'+CRUD_PORT);
const EntranceServiceProxy = httpProxy('http://localhost:'+ENTRANCE_PORT);

app.use('/admin', (req, res, next) => AdminServiceProxy(req, res, next));
/*
app.use('/payment',(req, res, next) => { //TESTE
  const allowedOrigins = ['https://semfila.app', 'https://semfila.tech'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return EntranceServiceProxy(req, res, next);
});
*/
app.use('/frontService', (req, res, next) => FrontServiceProxy(req, res, next));
app.use('/auth', (req, res, next) => LoginServiceProxy(req, res, next));
app.use('/qrcode', (req, res, next) => QrCodeServiceProxy(req, res, next));
app.use('/crud', (req, res, next) => CrudServiceProxy(req, res, next));
app.use('/payment', (req, res, next) => EntranceServiceProxy(req, res, next));
const { QrcodeReturner, QrCodeReSend, afterRefund, notifications_api } = require ( "./Entrance_Service/controllers/pagamento.controllers");
const { updateQrCode } = require("./QrCode_Service/controllers/qrCode.controllers")
const middleware = require("./middleware/auth.middleware")

//Cartão de crédito
//Recebendo notificações.
app.post("/notification_bill", (request, response)=> {
  console.log(request.body) //REALIZAR GET SOB O NOTIFICATION TOKEN
  //METODO PARA ATENDER A NOTIFICAÇÃO
  notifications_api(request.body.notification, io)
  response.status(200).end();

});

//Pix
app.post("/webhook", (request, response) => { 
  // Verifica se a requisição que chegou nesse endpoint foi autorizada
  //console.log("Entrou aqui 1")
  if (request.client.authorized) { 
      response.status(200).end();
  } else {
      response.status(401).end();
  }
});

app.post("/webhook/pix*", (req, res, next) => {
  //console.log("WEB HOOK RECEBIDO ")
  
  const {pix} = req.body
  if (!req.client.authorized) {
    return res.status(401).send('Invalid client certificate.');
  }
  if(pix){
    for (const order of pix) {
      let aux = {
        object: order.txid
      }
      req.aux = aux
  
      //Só pode chamar caso for um pagamento.
      if(!order.devolucoes){
        QrcodeReturner(req)
      }
      afterRefund(order) //Caso for reembolso.
    }
  }
  res.send({ ok: 1 })
});
//PIX
const io = require("socket.io")(server, {
  cors: {
    origins: [],
  },
});

server.listen('443', "0.0.0.0", () => {
  console.log(`Servidor rodando na porta 443`);
  createWebhook().then((output) => {
    console.log('webhook created.', output)
  })

});
const crypto = require("crypto");
const authMiddleware = require('./middleware/auth.middleware');
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
 
  let index = globalUsers.findIndex(function (user) {
    return user.sessionID === socket.sessionID;
  });

  if(index > -1){
   
   
    //Como nao recebi qrcode, reenviar.
    let aux = {
      index: index,
      sessionID: globalUsers[index].sessionID,
      dataToSave: globalUsers[index].dataToSave
    }
    console.log("Enviou qrcode")
    QrCodeReSend(aux,io)
  }
});
app.set("socketio", io);

app.post('/updateQrcode',async (req,res,next) => {
  middleware(req,res,next)
}, async (req,res)=>{
  var retorno = await updateQrCode(req)
  return res.send(retorno)
});

//Cache control
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