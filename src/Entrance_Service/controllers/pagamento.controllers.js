const userModel = require("../../models/user.model");
const pedidosModel = require("../../models/pedidos.model");
const authConfig = require("../config/auth");
const jwt = require("jsonwebtoken");
const { GNRequest } = require("../config/gerenciaNet.config");
const itemsModel = require("../../models/items.model");
const templater = require("./methods/template_function");
const Gerencianet = require('gn-api-sdk-node');
const QrCodesModel = require("../../models/qrCode.model");
const storeModel = require("../../models/store.model");

const Encrypter = require("./methods/Encrypter");
const qr = require("qr-image");
const globalUsers = require("../../resources/traficBus");
const mailer = require("../../modules/NodeMailer.controllers");
const mailerconfig = require("../../config/NodeMailer.config");
const moment = require('moment');
const limiter = require("./methods/limit_control")
const withDrawer = require("./methods/withDrawFunction")
const sendEmailer = require("./methods/sendEmailReembolso");
const sell_registryModel = require("../../models/sell_registry.model");

function AssimilateTime(time) {
  const d = new Date(time);
  moment.locale("pt-br");
  let data_show = moment(d).format("lll");
  return data_show;
}

module.exports = {
  async notifications_api(notification, io) {
    //Checar notification status.
    try {
      var params = {
        token: notification
      }
      var options = {

        client_id: process.env.GN_CLIENT_ID_DEV,
        client_secret: process.env.GN_CLIENT_SECRET_DEV,
        sandbox: true,
      }
      const gerencianet = new Gerencianet(options);
      var status = '';
      var custom_id = '';
      await gerencianet.getNotification(params)
        .then((resposta) => {
          if (resposta.code === 200) {
            for (let i = 0; i < resposta.data.length; i++) {
              console.log(resposta.data[i].status)
            }
            custom_id = resposta.data[resposta.data.length-1].custom_id
            status = resposta.data[resposta.data.length - 1].status.current
          }
        })
        .catch((error) => {
          console.log(error)
        })
      console.log(custom_id) //ID DO PEDIDO GUARDADO.
      if (status === 'paid') {
        console.log('Pago')
        //Caso pago então -> criar qrcode através do pedido usando custom_id
        //enviar ao email que foi pago e chegou
        //Enviar pelo IO o qrcode caso não chegar colocar na fila.
        
        //VERIFICANDO PEDIDO
        try {
          const pedido = await pedidosModel.findById({ _id: custom_id });
          if (!pedido) return false;
          var aux_ticket = {};
          var dataToSend = [];
          var dataToSave = [];
          var trigger = true;
          var total = 0;
          for (let i = 0; i < pedido.items.length; i++) {
            //console.log(pedido.items[i].item_name)
            //console.log("Loop => "+i)
            let verify = await limiter.limit_controller(pedido.items[i]._id, pedido.items[i].qtd) //Verificador para reembolsar
    
            if (!verify.status && verify.find && trigger) { //Caso falhe realizar o processo de estorno e enviar email.
              //Processo de Reembolso.
    
              await withDrawer.withDrawPedido(pedido, i); //REEMBOLSADOR
    
              trigger = false;
              break;
            }
            if (trigger) {
              aux_ticket = {
                item: pedido.items[i],
                user_id: pedido.user_id,
                user_email: pedido.user_email,
                pedido_id: pedido._id,
                cortesia: pedido.cortesia,
                company_id: pedido.company_id,
                store_id: pedido.store_id,
                store_name: pedido.store_name,
                trava: pedido.items[i].trava, //TRAVA DE SEGURANÇA - NOVA
                quantity: pedido.items[i].qtd,
                duration: pedido.items[i].duration,
                QrImage: "",
                state: true,
              };
    
              total = parseFloat((parseFloat(total) + parseFloat(pedido.items[i].price)).toFixed(2))
    
              var ticket = await QrCodesModel.create(aux_ticket);
    
              let datatoEncrypt = {
                _id: ticket._id,
                store_id: ticket.store_id,
              };
    
              let texto = Encrypter.encrypt(datatoEncrypt);
              const code = qr.imageSync(texto, {
                type: "png",
                size: 10,
              });
    
              //console.log(code);
              var base64data = Buffer.from(code, "binary").toString("base64");
              //console.log(base64data);
              ticket.QrImage = base64data;
              //console.log(ticket.QrImage);
    
              let object = {
                qrcode: base64data,
                data: ticket,
              };
              dataToSend.push(object);
              dataToSave.push(ticket._id)
              let updater = await QrCodesModel.findByIdAndUpdate(
                { _id: ticket._id },
                ticket
              );
            }
          }
    
          if (!trigger) {
            return "Finalizado.";
          }
          pedido.transaction_status = "PAID"
          pedido.status = true; //PEDIDO FOI PAGO
          await pedidosModel.findByIdAndUpdate(pedido._id, pedido);
          /* Enviar Email
          */
          if (pedido.user_email && !aux_ticket.cortesia) {
    
            var aux_items = pedido.items;
            let aux_sender = "";
            var store = await storeModel.findById({ _id: pedido.store_id })
            //Adicionar resgate.
            var url_button = store.store_url + "-" + ticket._id
            for (let i = 0; i < aux_items.length; i++) {
    
              let cons =
                "<tr style=border-collapse:collapse>" +
                "<td style=padding:0;Margin:0;font-size:xx-small;width:60px;text-align:center>" +
                aux_items[i].item_name +
                "</td>" +
                "<td style=padding:0;Margin:0;font-size:xx-small;width:60px;text-align:center>" +
                aux_items[i].description +
                "</td>" +
                "<td style=padding:0;Margin:0;width:100px;text-align:center>" +
                aux_items[i].qtd +
                "</td>" +
                "<td style=padding:0;Margin:0;width:60px;text-align:center>R$" +
                aux_items[i].price +
                "</td> " +
                "</tr>";
              /*
              let auxiliar =
              "<td align=center style=padding:0;Margin:0;font-size:0>"
            aux_items[i].item_name
            "</td>";
              */
    
              let auxiliar =
                `<td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="${aux_items[i].image_url}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="178" height="100"></td>`;
    
              aux_sender += `
              <tr style="border-collapse:collapse"> 
              <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:20px;padding-right:20px"> 
              <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:178px" valign="top"><![endif]--> 
              <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> 
                <tr style="border-collapse:collapse"> 
                 <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:178px"> 
                  <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                    <tr style="border-collapse:collapse"> 
                     ${auxiliar}
                    </tr> 
                  </table></td> 
                </tr> 
              </table> 
              <!--[if mso]></td><td style="width:20px"></td><td style="width:362px" valign="top"><![endif]--> 
              <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                <tr style="border-collapse:collapse"> 
                 <td align="left" style="padding:0;Margin:0;width:362px"> 
                  <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                    <tr style="border-collapse:collapse"> 
                     <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p> 
                      <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" role="presentation"> 
                        ${cons}
                      </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td> 
                    </tr> 
                  </table></td> 
                </tr> 
              </table>
              </tr>
              <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px"> 
                       <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                         <tr style="border-collapse:collapse"> 
                          <td valign="top" align="center" style="padding:0;Margin:0;width:560px"> 
                           <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                             <tr style="border-collapse:collapse"> 
                              <td align="center" style="padding:0;Margin:0;padding-bottom:10px;font-size:0"> 
                               <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                                 <tr style="border-collapse:collapse"> 
                                  <td style="padding:0;Margin:0;border-bottom:1px solid #EFEFEF;background:#FFFFFF none repeat scroll 0% 0%;height:1px;width:100%;margin:0px"></td> 
                                 </tr> 
                               </table></td> 
                             </tr> 
                           </table></td> 
                         </tr> 
                       </table></td>  `;
            }
    
            let data_aux = AssimilateTime(pedido.createdAt)
            mailer.sendMail(
              {
                to: pedido.user_email,
                from: mailerconfig.from,
                html: await templater.build_template(
                  pedido._id,
                  data_aux,
                  pedido.store_name,
                  total,
                  aux_sender,
                  url_button
                ),
                subject: "SemFila - Compra realizada com sucesso"
              },
              (err) => {
                if (err) {
                  console.log(err);
                }
              }
            );
    
    
          }
    
    
          //
          if (!aux_ticket.cortesia) {
            io.to(pedido.socket)
              .timeout(5000)
              .emit(
                "qrcodeGet",
                {
                  //realizar um callback
                  dataToSend,
                },
                (err, response) => {
                  if (err === null) { //Então gravar no global pois nao enviou
                    let aux = {
                      sessionID: pedido.socket,
                      dataToSave: dataToSave,
                    };
                    globalUsers.push(aux);
                    console.log("Gravou")
                  }
    
                  if (!response) {
    
    
                  } else {
                    console.log(response);
                  } //Faça nada
                }
              );
          }
    
        } catch (e) {
          console.log("Erro =============== paid");
          console.log(e);
        }
      }
      if (status === 'unpaid') {
        console.log('nao pago') 
        //Cancelar o pedido e enviar email ao usuário.

        try{
          const pedido = await pedidosModel.findById({ _id: custom_id})
          if(!pedido) throw new Error("Custom ID EMPTY")
          pedido.transaction_status = "Credit UNPAID"
          pedido.markModified("transaction_status")
          await pedido.save();
          let mensagem = "Sua operadora recusou o pagamento, por favor verifique com seu banco."
          let escopo = "Pagamento não foi autorizado";
          let subject = "Pagamento não autorizado";
          await sendEmailer.emailSend(pedido.user_email, escopo, mensagem, subject)
        }catch(e){
          console.log("Erro =============== unpaid");
          console.log(e);
        }
      }
      if (status === 'refunded') {
        console.log('estornado')
        //Cancelar pedido, buscar registro de venda e marcar como estornado.
        try{
          const pedido = await pedidosModel.findById({ _id: custom_id})
          if(!pedido) throw new Error("Custom ID EMPTY")
          pedido.transaction_status = "Credit REFUNDED"
          pedido.markModified("transaction_status")
          await pedido.save();
 
          //Procurar pelos qrcodes e alterar também registro de venda.
          const qrcodes = await QrCodesModel.find({pedido_id: pedido._id})
          if(qrcodes){
            //Caso tenha entao desativar e procurar por registros de venda
            for(let i =0; i<qrcodes.length;i++){
              qrcodes[i].state = false;
              qrcodes[i].withdraw = true;
              qrcodes[i].trava = true;
            }
            const sellRegistry = await sell_registryModel.find({pedido_id:pedido._id})
            if(sellRegistry){
              for(let i =0; i<sellRegistry.length;i++){
                sellRegistry[i].refund = true;
                sellRegistry[i].payment = "Credito Estornado"
              }
            }
          }

          let mensagem = "Sua operadora estornou o pagamento, por favor verifique com seu banco."
          let escopo = "Pagamento foi estornado";
          let subject = "Pagamento estornado";
          await sendEmailer.emailSend(pedido.user_email, escopo, mensagem, subject)
        }catch(e){
          console.log("Erro =============== unpaid");
          console.log(e);
        }
      }
      if (status === 'contested') { //CHARGEBACK
        console.log('contestado')
        //Cancelar pedido, buscar registro de venda e marcar como contestado.
        try{
          const pedido = await pedidosModel.findById({ _id: custom_id})
          if(!pedido) throw new Error("Custom ID EMPTY")
          pedido.transaction_status = "Credito contestado"
          pedido.markModified("transaction_status")
          await pedido.save();
 
          //Procurar pelos qrcodes e alterar também registro de venda.
          const qrcodes = await QrCodesModel.find({pedido_id: pedido._id})
          if(qrcodes){
            //Caso tenha entao desativar e procurar por registros de venda
            for(let i =0; i<qrcodes.length;i++){
              qrcodes[i].state = false;
              qrcodes[i].withdraw = true;
              qrcodes[i].trava = true;
            }
            const sellRegistry = await sell_registryModel.find({pedido_id:pedido._id})
            if(sellRegistry){
              for(let i =0; i<sellRegistry.length;i++){
                sellRegistry[i].refund = true;
                sellRegistry[i].payment = "Credito contestado"
              }
            }
          }

          let mensagem = "Sua operadora contestou o pagamento. Por isso estamos desativando seu pedido e qrcodes. Por favor verifique com seu banco."
          let escopo = "Pagamento foi contestado";
          let subject = "Pagamento contestado";
          await sendEmailer.emailSend(pedido.user_email, escopo, mensagem, subject)
        }catch(e){
          console.log("Erro =============== contested");
          console.log(e);
        }
      }
      if (status === 'unpaid') {
        console.log('nao pago') 
        //Cancelar o pedido e enviar email ao usuário.

        try{
          const pedido = await pedidosModel.findById({ _id: custom_id})
          if(!pedido) throw new Error("Custom ID EMPTY")
          pedido.transaction_status = "Credito não pago"
          pedido.markModified("transaction_status")
          await pedido.save();
          let mensagem = "Sua operadora recusou o pagamento, por favor verifique com seu banco."
          let escopo = "Pagamento não foi autorizado";
          let subject = "Pagamento não autorizado";
          await sendEmailer.emailSend(pedido.user_email, escopo, mensagem, subject)
        }catch(e){
          console.log("Erro =============== unpaid");
          console.log(e);
        }
      }
      if (status === 'refunded') {
        console.log('estornado')
        //Cancelar pedido, buscar registro de venda e marcar como estornado.
        try{
          const pedido = await pedidosModel.findById({ _id: custom_id})
          if(!pedido) throw new Error("Custom ID EMPTY")
          pedido.transaction_status = "Credito estornado"
          pedido.markModified("transaction_status")
          await pedido.save();
 
          //Procurar pelos qrcodes e alterar também registro de venda.
          const qrcodes = await QrCodesModel.find({pedido_id: pedido._id})
          if(qrcodes){
            //Caso tenha entao desativar e procurar por registros de venda
            for(let i =0; i<qrcodes.length;i++){
              qrcodes[i].state = false;
              qrcodes[i].withdraw = true;
              qrcodes[i].trava = true;
            }
            const sellRegistry = await sell_registryModel.find({pedido_id:pedido._id})
            if(sellRegistry){
              for(let i =0; i<sellRegistry.length;i++){
                sellRegistry[i].refund = true;
                sellRegistry[i].payment = "Credito Estornado"
              }
            }
          }

          let mensagem = "Sua operadora estornou o pagamento, por favor verifique com seu banco."
          let escopo = "Pagamento foi estornado";
          let subject = "Pagamento estornado";
          await sendEmailer.emailSend(pedido.user_email, escopo, mensagem, subject)
        }catch(e){
          console.log("Erro =============== refunded");
          console.log(e);
        }
      }
      if (status === 'canceled') {
        console.log('cancelado')
        //Cancelar pedido, buscar registro de venda e marcar como cancelado.
        try{
          const pedido = await pedidosModel.findById({ _id: custom_id})
          if(!pedido) throw new Error("Custom ID EMPTY")
          pedido.transaction_status = "Credito cancelado"
          pedido.markModified("transaction_status")
          await pedido.save();
 
          //Procurar pelos qrcodes e alterar também registro de venda.
          const qrcodes = await QrCodesModel.find({pedido_id: pedido._id})
          if(qrcodes){
            //Caso tenha entao desativar e procurar por registros de venda
            for(let i =0; i<qrcodes.length;i++){
              qrcodes[i].state = false;
              qrcodes[i].withdraw = true;
              qrcodes[i].trava = true;
            }
            const sellRegistry = await sell_registryModel.find({pedido_id:pedido._id})
            if(sellRegistry){
              for(let i =0; i<sellRegistry.length;i++){
                sellRegistry[i].refund = true;
                sellRegistry[i].payment = "Credito cancelado"
              }
            }
          }

          let mensagem = "Seu pagamento foi cancelado, por favor verifique com seu banco."
          let escopo = "Pagamento foi cancelado";
          let subject = "Pagamento cancelado";
          await sendEmailer.emailSend(pedido.user_email, escopo, mensagem, subject)
        }catch(e){
          console.log("Erro =============== cancelado");
          console.log(e);
        }
      }
      if (status === 'settled') {
        console.log('confirmado manualmente')
      }
      if (status === 'expired') {
        console.log('expirado')
        console.log(custom_id)
        //Cancelar pedido.
      }

    } catch (e) {
      console.log('Ocorreu um erro')
      console.log(e)
      console.log(e.message)
    }

  },
  async QrCodeReSend(object, io) {
    //RENVIAR QRCODE CASO USUÁRIO NÃO RECEBA

    const socketio = io;

    try {
      //Verificar se qrcode existe
      var dataToSend = []

      for (let i = 0; i < object.dataToSave.length; i++) {
        let qrcode = await QrCodesModel.findById({
          _id: object.dataToSave[i],
        });

        if (qrcode) {

          dataToSend.push(qrcode)
        }

      }

      socketio.to(object.sessionID).emit(
        "qrcodeGet",
        {
          //realizar um callback
          dataToSend,
        },
        (err, response) => {
          if (!err) {
            console.log("Não enviou");
          } else {
            console.log(object)
            globalUsers.splice(object.index, 1); //remover.
          } //Faça nada
        }
      );
    } catch (e) {
      console.log(e);
    }
  },
  async QrcodeReturner(req, res) {
    //APENAS EMITIR SOCKET
    const io = req.app.get("socketio");
    try {
      const pedido = await pedidosModel.findOne({ txid: req.aux.object });
      if (!pedido) console.log("FALHOU");
      var aux_ticket = {};
      var dataToSend = [];
      var dataToSave = [];
      var trigger = true;
      var total = 0;
      for (let i = 0; i < pedido.items.length; i++) {
        //console.log(pedido.items[i].item_name)
        //console.log("Loop => "+i)
        let verify = await limiter.limit_controller(pedido.items[i]._id, pedido.items[i].qtd) //Verificador para reembolsar

        if (!verify.status && verify.find && trigger) { //Caso falhe realizar o processo de estorno e enviar email.
          //Processo de Reembolso.

          await withDrawer.withDrawPedido(pedido, i); //REEMBOLSADOR

          trigger = false;
          break;
        }
        if (trigger) {
          aux_ticket = {
            item: pedido.items[i],
            user_id: pedido.user_id,
            user_email: pedido.user_email,
            pedido_id: pedido._id,
            cortesia: pedido.cortesia,
            company_id: pedido.company_id,
            store_id: pedido.store_id,
            store_name: pedido.store_name,
            trava: pedido.items[i].trava, //TRAVA DE SEGURANÇA - NOVA
            quantity: pedido.items[i].qtd,
            duration: pedido.items[i].duration,
            QrImage: "",
            state: true,
          };

          total = parseFloat((parseFloat(total) + parseFloat(pedido.items[i].price)).toFixed(2))

          var ticket = await QrCodesModel.create(aux_ticket);

          let datatoEncrypt = {
            _id: ticket._id,
            store_id: ticket.store_id,
          };

          let texto = Encrypter.encrypt(datatoEncrypt);
          const code = qr.imageSync(texto, {
            type: "png",
            size: 10,
          });

          //console.log(code);
          var base64data = Buffer.from(code, "binary").toString("base64");
          //console.log(base64data);
          ticket.QrImage = base64data;
          //console.log(ticket.QrImage);

          let object = {
            qrcode: base64data,
            data: ticket,
          };
          dataToSend.push(object);
          dataToSave.push(ticket._id)
          let updater = await QrCodesModel.findByIdAndUpdate(
            { _id: ticket._id },
            ticket
          );
        }
      }

      if (!trigger) {
        return "Finalizado.";
      }
      pedido.transaction_status = "PIX"
      pedido.status = true; //PEDIDO FOI PAGO
      await pedidosModel.findByIdAndUpdate(pedido._id, pedido);
      /* Enviar Email
      */
      if (pedido.user_email && !aux_ticket.cortesia) {

        var aux_items = pedido.items;
        let aux_sender = "";
        var store = await storeModel.findById({ _id: pedido.store_id })
        //Adicionar resgate.
        var url_button = store.store_url + "-" + ticket._id
        for (let i = 0; i < aux_items.length; i++) {

          let cons =
            "<tr style=border-collapse:collapse>" +
            "<td style=padding:0;Margin:0;font-size:xx-small;width:60px;text-align:center>" +
            aux_items[i].item_name +
            "</td>" +
            "<td style=padding:0;Margin:0;font-size:xx-small;width:60px;text-align:center>" +
            aux_items[i].description +
            "</td>" +
            "<td style=padding:0;Margin:0;width:100px;text-align:center>" +
            aux_items[i].qtd +
            "</td>" +
            "<td style=padding:0;Margin:0;width:60px;text-align:center>R$" +
            aux_items[i].price +
            "</td> " +
            "</tr>";
          /*
          let auxiliar =
          "<td align=center style=padding:0;Margin:0;font-size:0>"
        aux_items[i].item_name
        "</td>";
          */

          let auxiliar =
            `<td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img" src="${aux_items[i].image_url}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="178" height="100"></td>`;

          aux_sender += `
          <tr style="border-collapse:collapse"> 
          <td align="left" style="Margin:0;padding-top:5px;padding-bottom:10px;padding-left:20px;padding-right:20px"> 
          <!--[if mso]><table style="width:560px" cellpadding="0" cellspacing="0"><tr><td style="width:178px" valign="top"><![endif]--> 
          <table class="es-left" cellspacing="0" cellpadding="0" align="left" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:left"> 
            <tr style="border-collapse:collapse"> 
             <td class="es-m-p0r es-m-p20b" valign="top" align="center" style="padding:0;Margin:0;width:178px"> 
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                <tr style="border-collapse:collapse"> 
                 ${auxiliar}
                </tr> 
              </table></td> 
            </tr> 
          </table> 
          <!--[if mso]></td><td style="width:20px"></td><td style="width:362px" valign="top"><![endif]--> 
          <table cellspacing="0" cellpadding="0" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
            <tr style="border-collapse:collapse"> 
             <td align="left" style="padding:0;Margin:0;width:362px"> 
              <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                <tr style="border-collapse:collapse"> 
                 <td align="left" style="padding:0;Margin:0"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p> 
                  <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;width:100%" class="cke_show_border" cellspacing="1" cellpadding="1" border="0" role="presentation"> 
                    ${cons}
                  </table><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px"><br></p></td> 
                </tr> 
              </table></td> 
            </tr> 
          </table>
          </tr>
          <td align="left" style="padding:0;Margin:0;padding-left:20px;padding-right:20px"> 
                   <table width="100%" cellspacing="0" cellpadding="0" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                     <tr style="border-collapse:collapse"> 
                      <td valign="top" align="center" style="padding:0;Margin:0;width:560px"> 
                       <table width="100%" cellspacing="0" cellpadding="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                         <tr style="border-collapse:collapse"> 
                          <td align="center" style="padding:0;Margin:0;padding-bottom:10px;font-size:0"> 
                           <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0" role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px"> 
                             <tr style="border-collapse:collapse"> 
                              <td style="padding:0;Margin:0;border-bottom:1px solid #EFEFEF;background:#FFFFFF none repeat scroll 0% 0%;height:1px;width:100%;margin:0px"></td> 
                             </tr> 
                           </table></td> 
                         </tr> 
                       </table></td> 
                     </tr> 
                   </table></td>  `;
        }

        let data_aux = AssimilateTime(pedido.createdAt)
        mailer.sendMail(
          {
            to: pedido.user_email,
            from: mailerconfig.from,
            html: await templater.build_template(
              pedido._id,
              data_aux,
              pedido.store_name,
              total,
              aux_sender,
              url_button
            ),
            subject: "SemFila - Compra realizada com sucesso"
          },
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );


      }


      //
      if (!aux_ticket.cortesia) {
        io.to(pedido.socket)
          .timeout(5000)
          .emit(
            "qrcodeGet",
            {
              //realizar um callback
              dataToSend,
            },
            (err, response) => {
              if (err === null) { //Então gravar no global pois nao enviou
                let aux = {
                  sessionID: pedido.socket,
                  dataToSave: dataToSave,
                };
                globalUsers.push(aux);
                console.log("Gravou")
              }

              if (!response) {


              } else {
                console.log(response);
              } //Faça nada
            }
          );
      }

    } catch (e) {
      console.log("Erro ===============");
      console.log(e);
    }
  },
  async payPix(req, res) {
    var auth = "";
    var email = req.body.itemData.email;

    if (req.headers.authorization) {
      //AUTH
      const authHeader = JSON.parse(req.headers.authorization);
      //console.log(authHeader)
      if (!authHeader)
        return res.status(401).send({ msg: "Autenticação invalida!", error: 'Token não foi informado', success: false });

      const parts = authHeader.split(' ');

      if (!parts.length === 2)
        return res.status(401).send({ error: 'Token error', success: false, msg: 'Entre novamente' });

      const [scheme, token] = parts;

      if (!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error: 'Token formato inválido', success: false, msg: 'Entre novamente' });

      jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) return res.status(401).send({ error: 'Token inválido', success: false, msg: 'Entre novamente' });

        req.userID = decoded.id;
        req.userEmail = decoded.email

      })
      auth = req.userID
      email = req.userEmail
    }
    //Se usuário está autenticado, então.
    if (email === "") {
      return res.send({
        success: false,
        msg: "Email vazio."
      })
    }

    const socketId = req.body.idSocket;

    process.stdout.write("\033c");


    if (!req.body.itemData) {
      return res.send({
        success: false,
        msg: "Carrinho vazio."
      })
    }
    const dados = req.body.itemData;
    //Primeiro autenticar os dados, verificar items
    try {
      var items = [];
      var pag = 0;
      var desconto = 0;
      //VERIFICAR SE STORE EXISTE PRIMEIRO
      let store = await storeModel.findById(dados.store_id);

      if (store._id !== undefined) {
        for (let i = 0; i < dados.cart.length; i++) {
          let itemChecker = await itemsModel.findById({
            _id: dados.cart[i]._id,
          });
          if (itemChecker !== undefined) {
            if (itemChecker.limit_switch) {
              if (itemChecker.limit_number - dados.cart[i].qtd < 0) {
                return res.send({
                  success: false,
                  msg: itemChecker.item_name + " sobrou apenas: " + itemChecker.limit_number + "un.",
                  obj: itemChecker._id,
                })
              }
            }
            //Este item existe. Guardar ele em uma variavel diferente para não haver discrepancias nos dados.
            itemChecker.qtd = dados.cart[i].qtd;

            var duration = 0;
            if (itemChecker.promotion) {
              //Se ele estiver em uma promoção, tem tempo de vida
              duration = parseFloat(itemChecker.promotion_duration) * 24;
            } else {
              itemChecker.duration = 4380;
            }

            if (itemChecker.discount_status) {
              desconto =
                (parseFloat(desconto) +
                  parseFloat(itemChecker.discount_value)) *
                dados.cart[i].qtd;
              desconto = desconto.toFixed(2);
            }
            pag = pag + itemChecker.price * dados.cart[i].qtd;
            let aux_pusher = {
              _id: itemChecker._id,
              item_name: itemChecker.item_name,
              description: itemChecker.description,
              type: itemChecker.type,
              image_url: itemChecker.image_url,
              price: itemChecker.price,
              ncm: itemChecker.ncm,
              icms: itemChecker.icms,
              qtd: dados.cart[i].qtd,
              category_id: itemChecker.category_id,
              company_id: itemChecker.company_id,
              trava: itemChecker.trava,
              promotion: itemChecker.promotion,
              discount_status: itemChecker.discount_status,
              discount_value: itemChecker.discount_value,
              promotion_duration: itemChecker.promotion_duration,
              duration: duration,
              destaques: itemChecker.destaques,
            };
            items.push(aux_pusher);
          }
        }

        pag = pag.toFixed(2);
        pag = parseFloat(pag) - parseFloat(desconto);
        pag = pag.toFixed(2);
        //console.log(dados);

        if (items.length > 0) {
          //Se existir items validados continue
          //CRIAR UM PEDIDO COM OS ITEMS
          let object = {
            items: items,
            user_id: auth,
            txid: "",
            price: pag.toString(), //
            payment: "pix",
            store_id: dados.store_id,
            store_name: store.name,
            company_id: dados.company_id,
          };
          const pedido = await pedidosModel.create(object);

          if (pedido) {
            //Criar uma req pix
            const reqGNAlready = GNRequest({
              clientID: process.env.GN_CLIENT_ID,
              clientSecret: process.env.GN_CLIENT_SECRET,
            });
            //Criar Chave aleatoria pix
            const reqGN = await reqGNAlready;
            //const chavePix = await reqGN.post("/v2/gn/evp"); //CHAVE FUNCIONA SOMENTE EM PROD
            //Criar webhook com esta chave

            //Criando cobrança com esta chave

            const dataCob = {
              calendario: {
                expiracao: 3600,
              },
              valor: {
                original: pag.toString() //pag.toString(), //ATUALIZAR DEPOIS PARA pag
              },
              chave: "de8d8feb-a41c-47b0-969f-6afa1f35da4f",
              solicitacaoPagador: `SemFila - Pedido N ${pedido._id}`,
            };
            const cobResponse = await reqGN.post("/v2/cob/", dataCob);

            pedido.txid = cobResponse.data.txid;
            pedido.user_email = email

            pedido.loc_id = cobResponse.data.loc.id;
            pedido.socket = socketId;

            await pedidosModel.findByIdAndUpdate(pedido._id, pedido);
            const pixCode = await reqGN.get(
              `/v2/loc/${cobResponse.data.loc.id}/qrcode`
            );

            res.send({
              success: true,
              msg: "Pix Gerado",
              obj_pedido: pedido._id,
              obj: pixCode.data, //CODIGO PIX
            });
          }

        } else {
          //Retorne, carrinho está vazio ou os itens não existem
          return res.send({
            success: false,
            msg: "Itens no carrinho não existentes",
            obj: null,
          });
        }
      } else {
        return res.send({
          success: false,
          msg: "Loja não existe",
          obj: null,
        });
      }
    } catch (e) {
      //console.log(e);
      return res.send({
        success: false,
        msg: "Ops, ocorreu um erro",
        obj: null,
      });
    }
  },
  async CortesiaPay(req, res) {
    //console.log(socketId)
    //console.log("Pix")
    const dados = req.body.itemData;
    //console.log(req.body)
    //console.log(dados);

    //Primeiro autenticar os dados, verificar items
    try {
      const items = [];
      var pag = 0;

      //VERIFICAR SE STORE EXISTE PRIMEIRO
      let store = await storeModel.findById(req.stores[0]._id);
      //Verificações de segurança
      if (store._id !== undefined) {
        if (store.company_id !== req.company_id) {
          return res.send({
            success: false,
            msg: "Erro 801",
            obj: null,
          });
        }
        //Buscar e comparar se este usuário é o dono e esta gerando cortesia.
        let userChecker = await userModel.findById({ _id: req.userID });
        if (!userChecker) {
          return res.send({
            success: false,
            msg: "Usuário não existente",
            obj: null,
          });
        }
        //console.log(userChecker.type)
        if (userChecker.type !== "Owner") {
          return res.send({
            success: false,
            msg: "Usuário não é Dono.",
            obj: null,
          });
        }

        //Fim da verificação de segurança
        for (let i = 0; i < dados.length; i++) {
          let itemChecker = await itemsModel.findById({
            _id: dados[i]._id,
          });
          for (let y = 0; y < dados[i].qtd_qrcodes; y++) { //LAÇO PARA CADA ITEM TEM SUA QUANTIDADE DE QRCODES PARA CRIAR.
            if (itemChecker !== undefined) {
              //Este item existe. Guardar ele em uma variavel diferente para não haver discrepancias nos dados.
              itemChecker.qtd = dados[i].qtd;
              let aux_pusher = {
                item_name: itemChecker.item_name,
                description: itemChecker.description,
                type: itemChecker.type,
                image_url: itemChecker.image_url,
                price: itemChecker.price,
                qtd: dados[i].qtd,
                category_id: itemChecker.category_id,
                company_id: itemChecker.company_id,
                promotion: false,
                cortesia: true,
                discount_status: false,
                discount_value: itemChecker.discount_value,
                promotion_duration: itemChecker.promotion_duration,
                duration: 4380,
                destaques: false,
              };
              items.push(aux_pusher);
            }
          }
        }
        //console.log("Flag")
        pag = items.length * 2;
        //console.log(pag);
        pag = pag.toFixed(2)
        if (items.length > 0) {
          //Se existir items validados continue
          //CRIAR UM PEDIDO COM OS ITEMS
          let object = {
            items: items,
            user_id: req.userID,
            cortesia: true,
            txid: "",
            price: pag.toString(),
            store_name: store.name,
            store_id: store._id,
            company_id: req.company_id,
          };
          const pedido = await pedidosModel.create(object);
          if (pedido) {

            //Criar uma req pix
            const reqGNAlready = GNRequest({
              clientID: process.env.GN_CLIENT_ID,
              clientSecret: process.env.GN_CLIENT_SECRET,
            });

            const reqGN = await reqGNAlready;

            const dataCob = {
              calendario: {
                expiracao: 3600,
              },
              valor: {
                original: pag.toString(), //ATUALIZAR DEPOIS PARA pag
              },
              chave: "de8d8feb-a41c-47b0-969f-6afa1f35da4f",
              solicitacaoPagador: `SemFila - Pedido N ${pedido._id}`,
            };
            const cobResponse = await reqGN.post("/v2/cob/", dataCob);

            pedido.txid = cobResponse.data.txid;
            pedido.loc_id = cobResponse.data.loc.id;


            await pedidosModel.findByIdAndUpdate(pedido._id, pedido);
            const pixCode = await reqGN.get(
              `/v2/loc/${cobResponse.data.loc.id}/qrcode`
            );
            console.log(pixCode.data)
            res.send({
              success: true,
              msg: "Pix Gerado",

              obj: pixCode.data.imagemQrcode, //CODIGO PIX
            });
          }
        } else {
          //Retorne, carrinho está vazio ou os itens não existem
          return res.send({
            success: false,
            msg: "Por favor, selecione os items.",
            obj: null,
          });
        }
      } else {
        return res.send({
          success: false,
          msg: "Loja não existe",
          obj: null,
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        msg: "Ops, ocorreu um erro",
        obj: null,
      });
    }
  },
  async payCreditCard(req, res) {
    var auth = "";
    var email = req.body.itemData.email;

    if (req.headers.authorization) {
      //AUTH
      const authHeader = JSON.parse(req.headers.authorization);
      //console.log(authHeader)
      if (!authHeader)
        return res.status(401).send({ msg: "Autenticação invalida!", error: 'Token não foi informado', success: false });

      const parts = authHeader.split(' ');

      if (!parts.length === 2)
        return res.status(401).send({ error: 'Token error', success: false, msg: 'Entre novamente' });

      const [scheme, token] = parts;

      if (!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error: 'Token formato inválido', success: false, msg: 'Entre novamente' });

      jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) return res.status(401).send({ error: 'Token inválido', success: false, msg: 'Entre novamente' });

        req.userID = decoded.id;
        req.userEmail = decoded.email

      })
      auth = req.userID
      email = req.userEmail
    }
    //Se usuário está autenticado, então.
    if (email === "") {
      return res.send({
        success: false,
        msg: "Por favor, insira seu email."
      })
    }

    const socketId = req.body.idSocket;

    process.stdout.write("\033c");


    if (!req.body.itemData) {
      return res.send({
        success: false,
        msg: "Carrinho vazio."
      })
    }
    const dados = req.body.itemData;
    //Primeiro autenticar os dados, verificar items
    try {
      var items = [];
      var items_second = [];
      var pag = 0;
      var pag_second = 0;
      var desconto = 0;
      //VERIFICAR SE STORE EXISTE PRIMEIRO
      let store = await storeModel.findById(dados.store_id);

      if (store._id !== undefined) {
        for (let i = 0; i < dados.cart.length; i++) {
          let itemChecker = await itemsModel.findById({
            _id: dados.cart[i]._id,
          });
          if (itemChecker !== undefined) {
            if (itemChecker.limit_switch) {
              if (itemChecker.limit_number - dados.cart[i].qtd < 0) {
                return res.send({
                  success: false,
                  msg: itemChecker.item_name + " sobrou apenas: " + itemChecker.limit_number + "un.",
                  obj: itemChecker._id,
                })
              }
            }
            //Este item existe. Guardar ele em uma variavel diferente para não haver discrepancias nos dados.
            itemChecker.qtd = dados.cart[i].qtd;

            var duration = 0;
            if (itemChecker.promotion) {
              //Se ele estiver em uma promoção, tem tempo de vida
              duration = parseFloat(itemChecker.promotion_duration) * 24;
            } else {
              itemChecker.duration = 4380;
            }
            pag_second = parseFloat(itemChecker.price).toFixed(2)
            if (itemChecker.discount_status) {
              desconto =
                (parseFloat(desconto) +
                  parseFloat(itemChecker.discount_value)) *
                dados.cart[i].qtd;
              desconto = desconto.toFixed(2);
              pag_second = pag_second - desconto;
            }
            pag = pag + itemChecker.price * dados.cart[i].qtd;
            let aux_value = parseInt(pag_second.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')) // 25.00 => 2500
            //console.log(aux_value)
            items_second.push({
              name: itemChecker.item_name,
              value: aux_value,
              amount: dados.cart[i].qtd
            }
            )
            let aux_pusher = {
              _id: itemChecker._id,
              item_name: itemChecker.item_name,
              description: itemChecker.description,
              type: itemChecker.type,
              image_url: itemChecker.image_url,
              price: itemChecker.price,
              ncm: itemChecker.ncm,
              icms: itemChecker.icms,
              qtd: dados.cart[i].qtd,
              category_id: itemChecker.category_id,
              company_id: itemChecker.company_id,
              promotion: itemChecker.promotion,
              discount_status: itemChecker.discount_status,
              discount_value: itemChecker.discount_value,
              promotion_duration: itemChecker.promotion_duration,
              duration: duration,
              destaques: itemChecker.destaques,
            };
            items.push(aux_pusher);
          }
        }

        pag = pag.toFixed(2);
        pag = parseFloat(pag) - parseFloat(desconto);
        pag = pag.toFixed(2);
        //console.log(dados);

        if (items.length > 0) {
          //Se existir items validados continue
          //CRIAR UM PEDIDO COM OS ITEMS
          let object = {
            items: items,
            user_id: auth,
            txid: "",
            price: pag.toString(), //
            payment: "credit_card",
            store_id: dados.store_id,
            store_name: store.name,
            company_id: dados.company_id,
          };
          const pedido = await pedidosModel.create(object);

          if (pedido) {
            //Criar um link de pagamento.

            var options = {

              client_id: process.env.GN_CLIENT_ID_DEV,
              client_secret: process.env.GN_CLIENT_SECRET_DEV,
              sandbox: true,
            }


            //expire_at
            var today = new Date(Date.now())
            today.setDate(today.getDate() + 1)
            var todayDate = new Date(today).toISOString().slice(0, 10);
            var body = {
              items: items_second,
              metadata: {
                custom_id: pedido._id,
                notification_url: "https://api-semfila.api-semfila.online/notification_bill"
              },
              settings: {
                message: `Obrigado por comprar com a SemFila, seu número do pedido é ${pedido._id}.`,
                payment_method: "credit_card",
                request_delivery_address: false,
                expire_at: todayDate
              }
            }
            //OPTIONS
            let params = {
              id: 0,
            }
            var cobResponse = '';
            const gerencianet = new Gerencianet(options);
            await gerencianet.createOneStepLink(params, body)
              .then((resposta) => {
                if (resposta.code === 200) {
                  cobResponse = resposta
                }
              })
              .catch((error) => {
                console.log(error)
              })
            //Atualizar pedido.
            if (cobResponse.code === 200) {
              pedido.charge_id = cobResponse.data.charge_id
              pedido.markModified('charge_id')
              pedido.save();
              return res.send({
                success: true,
                msg: "Transferindo para o pagamento",
                url: cobResponse.data.payment_url
              });
            } else {
              return res.send({
                success: false,
                msg: "Não foi possivel gerar pagamento.",

              });
            }

          }

        } else {
          //Retorne, carrinho está vazio ou os itens não existem
          return res.send({
            success: false,
            msg: "Itens no carrinho não existentes",
            obj: null,
          });
        }
      } else {
        return res.send({
          success: false,
          msg: "Loja não existe",
          obj: null,
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        msg: "Ops, ocorreu um erro",
        obj: null,
      });
    }
  },
  async afterRefund(order) {
    //Verificar pelo pedido o txid e preparar o refundEmail.
    //console.log(order)
    if (order.devolucoes) {
      if (order.devolucoes[0].status === "DEVOLVIDO") {
        const pedido = await pedidosModel.findOne({ txid: order.txid });
        if (pedido) {
          //Encontrou então enviar email.
          await sendEmailer.refundEmail(pedido._id, order.devolucoes[0].valor, pedido.user_email)

        }
      }
    }

  }
};
