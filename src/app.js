require("dotenv").config()
const stripe = require('stripe')(process.env.STRIPE_CLIENT_SECRET);
const express = require('express');
const httpProxy = require('express-http-proxy');
const app = express();
const db = require("./config/db"); //NÃO REMOVA DE HIPÓTESE ALGUMA
const globalUsers = require("./resources/traficBus");

const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const middleware = require("./middleware/auth.middleware")
const helmet = require('helmet')
const mongoSanitize = require("express-mongo-sanitize")
const httpsOptions = {
  cert: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/fullchain.pem'), // Certificado fullchain do dominio
  key: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/privkey.pem'), // Chave privada do domínio
  minVersion: "TLSv1.2",
  requestCert: true,
  rejectUnauthorized: false, 
};
const { QrcodeReturner, QrCodeReSend, afterRefund, notifications_api, confirmPaymentReq } = require("./Entrance_Service/controllers/pagamento.controllers");
const { updateQrCode } = require("./QrCode_Service/controllers/qrCode.controllers")
const port = 443;
const {
  ADMIN_PORT,
  FRONT_PORT,
  LOGIN_PORT,
  QRCODE_PORT,
  CRUD_PORT,
  ENTRANCE_PORT
} = process.env;
const AdminServiceProxy = httpProxy('http://localhost:' + ADMIN_PORT);
const FrontServiceProxy = httpProxy('http://localhost:' + FRONT_PORT);
const LoginServiceProxy = httpProxy('http://localhost:' + LOGIN_PORT);
const QrCodeServiceProxy = httpProxy('http://localhost:' + QRCODE_PORT);
const CrudServiceProxy = httpProxy('http://localhost:' + CRUD_PORT);
const EntranceServiceProxy = httpProxy('http://localhost:' + ENTRANCE_PORT);
//Cache control
const setCache = function (req, res, next) {
  const period = 60 * 2;
  if (req.method == "POST" || req.method == "GET") {
    res.set("Cache-control", `public, max-age=${period}`);
  } else {
    res.set("Cache-control", `no-store`);
  }
  next();
}

app.use(cors());
app.use(helmet());
app.use(mongoSanitize())
app.disable('x-powered-by')

//WEBHOOK STRIPE

app.post('/stripeWebhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  switch (event.type) {
    case 'charge.succeeded':
      console.log(event.data.object.payment_intent)
      confirmPaymentReq(io, event.data.object.payment_intent)
      break;
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));

var server = require("https").createServer(httpsOptions, app);
const io = require("socket.io")(server, {
  cors: {
    origins: []
  },
});



app.use('/admin', (req, res, next) => AdminServiceProxy(req, res, next));
app.use('/frontService', (req, res, next) => FrontServiceProxy(req, res, next));
app.use('/auth', (req, res, next) => LoginServiceProxy(req, res, next));
app.use('/qrcode', (req, res, next) => QrCodeServiceProxy(req, res, next));
app.use('/crud', (req, res, next) => CrudServiceProxy(req, res, next));
app.use('/payment', (req, res, next) => EntranceServiceProxy(req, res, next));
app.use(setCache)
app.set("socketio", io);


//Atualizador de qrcode que utiliza o WEBSOCKET
app.post('/updateQrcode', async (req, res, next) => {
  middleware(req, res, next)
}, async (req, res) => {
  var retorno = await updateQrCode(req)
  return res.send(retorno)
});

//Cartão de crédito
//Recebendo notificações.
app.post("/notification_bill", (request, response) => {
  console.log(request.body) //REALIZAR GET SOB O NOTIFICATION TOKEN
  //METODO PARA ATENDER A NOTIFICAÇÃO
  notifications_api(request.body.notification, io)
  response.status(200).end();

});

//WEBHOOK PIX
app.post("/webhook", (request, response) => {
  console.log(request)
  const { type } = request.body
  switch (type){
    case 'order.paid':
      console.log("Pedido foi pago")
      request.aux = request.body.data.order.id
      console.log(request.aux)
      QrcodeReturner(request)
      break;
    case 'order.payment_failed':
      console.log("Pedido falhou ao pagar")
      break;
    case 'order.canceled':
      console.log("Pedido foi cancelado")
      break;
    case 'charge.paid':
      console.log("Cobrança foi pago")
      break;
    case 'charge.refunded':
      console.log("Cobrança foi estornada")
      let aux = request.body.data.order.id
      afterRefund(aux)

      break;
    default: 
    console.log(`Unhandled event type ${type}`);
  }
  /*
     for (const order of pix) {
      let aux = {
        object: order.txid //order id
      }
      req.aux = aux

      //Só pode chamar caso for um pagamento.
      if (!order.devolucoes) {
        QrcodeReturner(req)
      }
      afterRefund(order) //Caso for reembolso.
    }
  */
  response.status(200).end();
});

app.post("/webhook/pix*", (req, res, next) => {
  const { pix } = req.body
  if (!req.client.authorized) {
    return res.status(401).send('Invalid client certificate.');
  }
  if (pix) {
    for (const order of pix) {
      let aux = {
        object: order.txid
      }
      req.aux = aux

      //Só pode chamar caso for um pagamento.
      if (!order.devolucoes) {
        QrcodeReturner(req)
      }
      afterRefund(order) //Caso for reembolso.
    }
  }
  res.send({ ok: 1 })
});
// WEBSOCKET IO
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;

  if (sessionID) {
    // find existing session


    socket.sessionID = sessionID;

    return next();

  }
  // Criar nova sessão
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

  if (index > -1) {
    //Reenviar qrcode caso não foi enviado.
    let aux = {
      index: index,
      sessionID: globalUsers[index].sessionID,
      dataToSave: globalUsers[index].dataToSave
    }
    QrCodeReSend(aux, io)
  }
});



server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta 443`);

});