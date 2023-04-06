require("dotenv").config()
const globalUsers = require("./resources/traficBus");
const {createWebhook} = require('./config/gerenciaNet.config')
const Server = require("./server")
const server = new Server()

const { QrcodeReturner, QrCodeReSend, afterRefund, notifications_api } = require ( "./Entrance_Service/controllers/pagamento.controllers");
const { updateQrCode } = require("./QrCode_Service/controllers/qrCode.controllers")
const middleware = require("./middleware/auth.middleware")

//Cartão de crédito
//Recebendo notificações.
server.getApp().post("/notification_bill", (request, response)=> {
  console.log(request.body) //REALIZAR GET SOB O NOTIFICATION TOKEN
  //METODO PARA ATENDER A NOTIFICAÇÃO
  notifications_api(request.body.notification, io)
  response.status(200).end();

});

console.log(server.getApp())
console.log(server.getServer())

//Pix
server.getApp().post("/webhook", (request, response) => { 
  // Verifica se a requisição que chegou nesse endpoint foi autorizada
  //console.log("Entrou aqui 1")
  if (request.client.authorized) { 
      response.status(200).end();
  } else {
      response.status(401).end();
  }
});

server.getApp().post("/webhook/pix*", (req, res, next) => {
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
const io = require("socket.io")(server.getServer(), {
  cors: {
    origins: [],
  },
});

server.getServer().listen('443', "0.0.0.0", () => {
  console.log(`Servidor rodando na porta 443`);
  createWebhook().then((output) => {
    console.log('webhook created.', output)
  })

});
const crypto = require("crypto");

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
    //console.log("Enviou qrcode")
    QrCodeReSend(aux,io)
  }
});
server.getApp().set("socketio", io);

server.getApp().post('/updateQrcode',async (req,res,next) => {
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
server.getApp().use(setCache)