const QrCodesModel = require("../../models/qrCode.model");
const Encrypter = require("./methods/Encrypter");
const sellRegistryModel = require("../../models/sell_registry.model");
const User_model = require("../../models/user.model");
const storeModel = require("../../models/store.model");
const userModel = require("../../models/user.model");
const mailer = require("../../modules/NodeMailer.controllers");
const mailerconfig = require("../../config/NodeMailer.config");
const pedidosModel = require("../../models/pedidos.model");
const itemModel = require("../../models/items.model")
const qr = require("qr-image");



const { sendQrCodeUpdates } = require("../utils/sendMessages");
const itemsModel = require("../../models/items.model");
module.exports = {
  async requestWithDraw(req, res) {
    const id = req.body.id;
    if (id) {
      try {
        const QrCode = await QrCodesModel.findById(id);
        console.log(QrCode.quantity);
        console.log(QrCode.state);
        if (QrCode) {
          //TESTAR SE É POSSIVEL PEDIR REEMBOLSO
          var d = QrCode.createdAt;
          var seconds = d.getTime() / 1000;
          var expire = seconds + 7 * 24 * 3600;
          var date_expire = new Date(expire * 1000);
          let today = new Date(Date.now());
          if (QrCode.withdraw) {
            return res.send({
              obj: null,
              success: false,
              msg: "Reembolso já solicitado.",
            });
          }
          if (!QrCode.state) {
            return res.send({
              obj: null,
              success: false,
              msg: "Este QrCode está desativado.",
            });
          }
          if (QrCode.quantity < 1) {
            return res.send({
              obj: null,
              success: false,
              msg: "Não existe mais itens no qrcode",
            });
          }

          if (date_expire > today) {
            //Caso o dia expire seja maior pode solicitar
            QrCode.withdraw = true;
            const update_qrcode = await QrCodesModel.findByIdAndUpdate({ _id: QrCode._id }, QrCode)
            if (!update_qrcode) {
              return res.send({
                obj: null,
                success: false,
                msg: "Falha ao pedir reembolso",
              });
            }
            //Enviar Email para usuário.
            if (QrCode.user_id) {
              const user = await userModel.findById({ _id: QrCode.user_id })
              if (user) {
                let valor = (parseFloat(QrCode.item.price) * parseFloat(QrCode.quantity)).toFixed(2)
                let escopo = "Pedido de reembolso foi solicitado. "
                let mensagem = "O Reembolso do QRCODE vindo do pedido " + QrCode.pedido_id + " no valor de: R$" + valor + ", Foi solicitado. Aguarde 7 dias úteis para o reembolso ser emitido. Agradecemos pela experiência conosco e estamos sempre a sua disposição. Por SemFila."

                mailer.sendMail(
                  {
                    to: user.email,
                    from: mailerconfig.from,
                    template: "EmailTemplateBasic",
                    subject: "SemFila - Reembolso solicitado.",
                    context: { escopo, mensagem },
                  },
                  (err) => {
                    if (err) {
                      console.log(err);
                      return res.send({
                        msg: "Não foi possivel gerar o email!",
                        success: false,
                      });
                    }
                  }
                );

              }
            }

            return res.status(200).send({
              obj: QrCode,
              success: true,
              msg: "Reembolso Solicitado",
            });
          } else {
            return res.send({
              obj: null,
              success: false,
              msg: "Só é possivel até 7 dias após a compra.",
            });
          }
        } else {
          return res.send({
            obj: null,
            success: false,
            msg: "QrCode não localizado.",
          });
        }
      } catch (e) {
        //ERRO 705
        console.log(e);
        return res.send({
          obj: null,
          success: false,
          msg: "Erro ocorrido 705.",
        });
      }
    }
  },
  async refreshSingleQrCode(req, res) {

    const id = req.body.id;
    if (id) {
      try {
        const QrCode = await QrCodesModel.findById(id);

        if (QrCode) {
          if (QrCode.state) {
            var trigger = false;
            if (QrCode.quantity > 0) {
              //A PARTIR DAQUI É CHECAGEM DE DATAS (PROMOÇÃO E SE PASSOU DE 6 MESES.)
              if (!QrCode.item.promotion) {
                //SE NAO ESTIVER, SOMAR COM 6 MESES
                var d = new Date(QrCode.createdAt);
                var seconds = d.getTime() / 1000;
                var expire = seconds + 6 * 730 * 3600;
                var date_expire = new Date(expire * 1000);
                //checagem de 6 meses
                if (Date.now() > date_expire) {
                  QrCode.state = false;
                  trigger = true;
                } else {
                  trigger = false;
                }
              } else { //Checar se estiver em promoção mas invalidou.
                var d = new Date(QrCode.createdAt);
                var seconds = d.getTime() / 1000;
                var expire =
                  seconds +
                  parseFloat(QrCode.item.promotion_duration) * 24 * 3600;
                var date_expire = new Date(expire * 1000);
                if (Date.now() > date_expire) {
                  QrCode.state = false;
                  trigger = true;
                } else {
                  trigger = false;
                }
              }
            } else {
              QrCode.state = false;
              trigger = true;
            }
            if (trigger) {
              await QrCodesModel.findByIdAndUpdate({ _id: QrCode._id }, QrCode);
            }
          }
          return res.status(200).send({
            obj: QrCode,
            success: true,
            msg: "QrCode Atualizado",
          });
        } else {
          return res.send({
            obj: null,
            success: false,
            msg: "QrCode não localizado.",
          });
        }
      } catch (e) {
        //ERRO 704
        console.log(e);
        return res.send({
          obj: null,
          success: false,
          msg: "Erro ocorrido 704.",
        });
      }
    }
  },
  async refreshQrCodes(req, res) {
    try {
      const user = await User_model.findById(req.userID);
      if (!user)
        return res.send({ msg: "Realize o login primeiro", success: false });
      const qrcodes = await QrCodesModel.find({ user_id: req.userID });
      var array_toSend = [];
      var trigger = false;
      for (let i = 0; i < qrcodes.length; i++) {
        if (qrcodes[i].state) {
          if (qrcodes[i].quantity > 0) {
            //A PARTIR DAQUI É CHECAGEM DE DATAS (PROMOÇÃO E SE PASSOU DE 6 MESES.)
            if (qrcodes[i].item.promotion) {
              array_toSend.push(qrcodes[i]);
              /*
              //Chegam promoção
              var d = new Date(qrcodes[i].createdAt);
              var seconds = d.getTime() / 1000;
              var expire =
                seconds +
                parseFloat(qrcodes[i].item.promotion_duration) * 24 * 3600;
              var date_expire = new Date(expire * 1000);
              if (new Date(Date.now()) > date_expire) {
              }
              */
            } else {
              //SE NAO ESTIVER, SOMAR COM 6 MESES
              var d = new Date(qrcodes[i].createdAt);
              var seconds = d.getTime() / 1000;
              var expire = seconds + 6 * 730 * 3600;
              var date_expire = new Date(expire * 1000);
              //checagem de 6 meses
              if (Date.now() > date_expire) {
                qrcodes[i].state = false;
                trigger = true;
              } else {
                //Adicionar no Array para retornar.
                array_toSend.push(qrcodes[i]);
                trigger = false;
              }
            }
          } else {
            qrcodes[i].state = false;
            trigger = true;
          }
          if (trigger) {
            await QrCodesModel.findByIdAndUpdate({ _id: qrcodes[i]._id }, qrcodes[i]);
          }
        }
      }
      if (array_toSend.length > 0) {
        return res.status(200).send({
          obj: array_toSend,
          success: true,
          msg: "QrCodes atualizados",
        });
      } else {
        return res.status(200).send({
          obj: array_toSend,
          success: true,
          msg: "QrCodes atualizados",
        });
      }
    } catch (e) {
      console.log(e);
      res.send({
        obj: null,
        success: false,
        msg: "Erro ocorreu ao atualizar - 981",
        error: e.message,
      });
    }
  },
  async fetchQrCodesEmp(req, res) { //Trazer cortesias da empresa, somente Dono
    try {
      const user = await User_model.findById(req.userID);
      if (!user)
        return res.send({ msg: "Realize o login primeiro", success: false });
      //Adicionar data
      var aux_ini = new Date(new Date(req.body.dataIni).toDateString())
      aux_ini.setUTCHours(0, 0, 0, 0);
      var dataIni = new Date(aux_ini).toUTCString();

      var aux_fim = new Date(new Date(req.body.dataFim).toDateString())
      aux_fim.setUTCHours(23, 59, 59, 999);
      var dataFim = new Date(aux_fim).toUTCString();

      const qrcodes = await QrCodesModel.find({
        user_id: req.userID,
        createdAt: {
          $gte: dataIni,
          $lt: dataFim
        }
      })
      var array_toSend = [];
      var trigger = false;
      for (let i = 0; i < qrcodes.length; i++) {
          if (qrcodes[i].quantity >= 0) {
            //A PARTIR DAQUI É CHECAGEM DE DATAS (PROMOÇÃO E SE PASSOU DE 6 MESES.)
            if (qrcodes[i].cortesia) {
              //SE NAO ESTIVER, SOMAR COM 6 MESES
              var d = new Date(qrcodes[i].createdAt);
              var seconds = d.getTime() / 1000;
              var expire = seconds + 6 * 730 * 3600;
              var date_expire = new Date(expire * 1000);
              //checagem de 6 meses
              if (Date.now() > date_expire) {
                qrcodes[i].state = false;
                trigger = true
              } else {
                //Adicionar no Array para retornar.
                trigger = false;
                array_toSend.push(qrcodes[i]);
              }
            }
          } else {
            qrcodes[i].state = false;
            trigger = true
          }
        
        if (trigger) {
          await QrCodesModel.findByIdAndUpdate({ _id: qrcodes[i]._id }, qrcodes[i]);
        }
      }
      if (array_toSend.length > 0) {
        return res.status(200).send({
          obj: array_toSend,
          success: true,
          msg: "QrCodes atualizados",
        });
      } else {
        return res.status(200).send({
          obj: array_toSend,
          success: true,
          msg: "QrCodes atualizados",
        });
      }
    } catch (e) {
      console.log(e);
      res.send({
        obj: null,
        success: false,
        msg: "Erro ocorreu ao atualizar - 981",
        error: e.message,
      });
    }
  },
  async fetchQrCode(req, res) {
    //
    //Descriptografa

    let criptografado = req.body.itemData;

    const dados = await Encrypter.decrypt(criptografado);

    if (req.body.itemData !== "") {
      try {
        const QrCode = await QrCodesModel.findById(dados.item._id);
        const storeCheck = await storeModel.findById(dados.item.store_id);
        if (!storeCheck) {
          return res.send({
            obj: null,
            success: false,
            msg: "Cardapio não existente no qrcode",
          });
        } else if (storeCheck._id.toString() !== dados.item.store_id) {
          return res.send({
            obj: null,
            success: false,
            msg: "QrCode de outro cardapio",
          });
        }
        if (QrCode) { //Verificar se qrcode esta expirado ou não
          console.log(QrCode.item)
          const item = await itemModel.findById({ _id: QrCode.item._id })
          if (!item) {
            return res.send({ success: false, msg: "Este produto não existe" })
          }
          if (QrCode.state) {
            if (!item.status) {
              if (QrCode.trava) {
                return res.send({ success: false, msg: "Produto desativado" })
              }
            }

            if (!QrCode.item.promotion) {
              //SE NAO ESTIVER, SOMAR COM 6 MESES
              var d = new Date(QrCode.createdAt);
              var seconds = d.getTime() / 1000;
              var expire = seconds + 6 * 730 * 3600;
              var date_expire = new Date(expire * 1000);
              //checagem de 6 meses
              if (date_expire > Date.now()) { //Pode utilizar
                return res.send({
                  obj: QrCode,
                  success: true,
                  msg: "QrCode Encontrado",
                });
              } else { //Expirou
                return res.send({
                  obj: null,
                  success: false,
                  msg: "QrCode está Expirado",
                });
              }
            } else {
              var d = new Date(QrCode.createdAt);
              var seconds = d.getTime() / 1000;
              var expire =
                seconds +
                parseFloat(QrCode.item.promotion_duration) * 24 * 3600;
              var date_expire = new Date(expire * 1000)
              console.log(date_expire)
              if (date_expire > d) { //Pode utilizar
                return res.send({
                  obj: QrCode,
                  success: true,
                  msg: "QrCode Encontrado",
                });
              } else { //Expirou
                return res.send({
                  obj: null,
                  success: false,
                  msg: "QrCode está Expirado",
                });
              }
            }


          } else {
            return res.send({
              obj: null,
              success: false,
              msg: "QrCode está Zerado",
            });
          }
        } else {
          res.send({
            obj: null,
            success: false,
            msg: "QrCode não existe!",
            obj2: req.body.itemData,
          });
        }
      } catch (e) {
        console.log(e);
        res.send({
          obj: null,
          success: false,
          msg: "QrCode Inválido-1",
          error: e.message,
        });
      }
    } else {
      res.send({ obj: null, success: false, msg: "QrCode Inválido-2" });
    }
  },
  async updateQrCode(req, res) {
    const itemUpdate = req.body;
    //Buscar qrcode para validar
    try {
      //Verificar primeiro se QrCode é dessa loja mesmo.
      if (itemUpdate.store_id !== req.stores[0]._id) {

        //Precisa arrumar depois o metodo de verificação.
        return {
          obj: null,
          success: false,
          msg: "QrCode de outro cardapio.",
        };
      }
      const qrcode = await QrCodesModel.findById(itemUpdate._id);
      if (qrcode) {
        const io = req.app.get("socketio");
        var pedido = ''
        if(qrcode.pedido_id !== "Adquirido na portaria"){
          pedido = await pedidosModel.findById({ _id: qrcode.pedido_id })
        }else{
          pedido = true; //ADQUIRIDO NA PORTARIA
        }
        
        if (!pedido) {
          return { success: false, msg: "Compra não encontrada" }
        }
        //Caso existe verificar store_id e quantidade pedida
        if (qrcode.withdraw) { //Caso o QrCode foi solicitado para reembolso.
          return {
            obj: null,
            success: false,
            msg: "QrCode em processo de Reembolso.",
          };
        }

        //VERIFICAR SE O ITEM EXISTE.
        
        const item = await itemModel.findById({ _id: qrcode.item._id });
        if (!item) {
          return {
            obj: null,
            success: false,
            msg: "Este produto não existe"
          }
        }

        if (!item.status) { //Está desligado
          if (item.trava) { //Trava está ativada. ENTÃO finalize
            return {
              obj: null,
              success: false,
              msg: "Produto está desativado."
            }
          }
        }

        if (qrcode.quantity >= itemUpdate.quantity && itemUpdate.quantity > 0) {
          //Verificar se é maior q 0

          //ALTERAR QRCODE E SALVAR NO REGISTRO
          qrcode.quantity = qrcode.quantity - itemUpdate.quantity;
          if (qrcode.quantity < 0) {//Nunca se sabe

            return {
              obj: null,
              success: false,
              msg: "Erro 712 - Qtd negativa.",
            };
          }

          if (qrcode.quantity === "0") {
            qrcode.state = false;
          }
          let aux_price = 0;

          //REGISTRAR
          if (qrcode.item.discount_status) { //Verificador de desconto
            aux_price = (
              (parseFloat(qrcode.item.price) - parseFloat(qrcode.item.discount_value)) * parseFloat(itemUpdate.quantity)
            ).toFixed(2);
          } else {
            aux_price = (
              parseFloat(qrcode.item.price) * parseFloat(itemUpdate.quantity)
            ).toFixed(2);
          }

          let objeto_registro = {
            user_id: req.userID,
            user_name: req.userName,
            user_email: qrcode.user_email,
            pedido_id: qrcode.pedido_id,
            payment: pedido.payment, //Identificador de pagamento
            company_id: req.company_id,
            store_id: req.stores[0]._id, //ARRUMAR
            qrcode_id: qrcode._id,
            item: qrcode.item,
            draw: false,
            cortesia: qrcode.cortesia,
            quantity: itemUpdate.quantity,
            total: aux_price,
          };

          const sellRegistry = await sellRegistryModel.create(objeto_registro);
          if (sellRegistry) {

            const qrcodeUpdater = await QrCodesModel.findByIdAndUpdate(
              qrcode._id,
              qrcode
            );

            if (qrcodeUpdater && !pedido.cortesia) {
              io.to(pedido.socket)
                .timeout(8000)
                .emit("updateQrCode",{qrcode});
              console.log("Aqui ----=>")
              return {
                obj: qrcode,
                success: true,
                msg: "Retirado :" + itemUpdate.quantity + " item(s)",
              };
            } else {
              const removeUpdate = await sellRegistryModel.findByIdAndDelete(
                sellRegistry._id
              );
              if (removeUpdate) {
                return {
                  obj: null,
                  success: false,
                  msg: "Falha ao gravar no sistema",
                };
              } else {
                return {
                  obj: null,
                  success: false,
                  error:
                    "Erro critico no sistema ao deletar registro de venda após qrcode não ser criado.",
                  msg: "Erro Critico",
                };
              }
            }
          } else {
            return {
              obj: null,
              success: false,
              msg: "Falha ao gravar no sistema",
            }
          }
        } else {
          return {
            obj: null,
            success: false,
            msg: "Sem itens no qrcode",
          }
        }
      } else {

        return {
          obj: null,
          success: false,
          msg: "QrCode não localizado",
        }
      }
    } catch (e) {
      console.log(e);
      return {
        obj: null,
        success: false,
        msg: "Erro ao atualizar",
        error: e.message,
      }
    }
  },
  async updateQrCodeCortesia(req, res) {
    const itemUpdate = req.body;
    console.log(req.body)
    //Buscar qrcode para validar
    try {
      //Verificar primeiro se QrCode é dessa loja mesmo.

      if (itemUpdate.store_id !== req.stores[0]._id) {

        //Precisa arrumar depois o metodo de verificação.
        return res.send({
          obj: null,
          success: false,
          msg: "QrCode de outro cardapio.",
        });
      }
      console.log("FLAG 1")
      const qrcode = await QrCodesModel.findById(itemUpdate._id);
      if (qrcode) {
        console.log("FLAG 2")
        if(qrcode.pedido_id !== "Adquirido na portaria"){
          pedido = await pedidosModel.findById({ _id: qrcode.pedido_id })
        }else{
          pedido = true; //ADQUIRIDO NA PORTARIA
        }
        
        if (!pedido) {
          return res.send({ success: false, msg: "Compra não encontrada" })
        }
      
        if (qrcode.withdraw) { //Caso o QrCode foi solicitado para reembolso.
          return res.send({
            obj: null,
            success: false,
            msg: "QrCode em processo de Reembolso.",
          })
        }

        //VERIFICAR SE O ITEM EXISTE.
        
        const item = await itemModel.findById({ _id: qrcode.item._id });
        if (!item) {
          return res.send({
            obj: null,
            success: false,
            msg: "Este produto não existe"
          })
        }
        console.log("FLAG 3")
        //Atualizar QRCODE
        if(itemUpdate.quantity >=0){
          qrcode.quantity = itemUpdate.quantity;
        }
        if(itemUpdate.user_name !== undefined)
        if(itemUpdate.user_name.length < 20 && itemUpdate.user_name.length > 0){
          qrcode.user_name = itemUpdate.user_name;
        }
        if(itemUpdate.user_cpf !== undefined)
        if(itemUpdate.user_cpf.length < 14 && itemUpdate.user_cpf.length > 0 ){
        qrcode.user_cpf = itemUpdate.user_cpf;
        }
        
      
        qrcode.state = itemUpdate.state;
        console.log(qrcode)
        console.log("FLAG 4")
        const updateQRCODE = await QrCodesModel.findByIdAndUpdate({_id:qrcode._id}, qrcode)
        if(updateQRCODE){
          return res.send({obj:qrcode, msg:"QRCODE ATUALIZADO", success:true})
        }else{
          return res.send({msg:"Falha ao atualizar", success:false})
        }
       
      } else {

        return res.send({
          obj: null,
          success: false,
          msg: "QrCode não localizado",
        })
      }
    } catch (e) {
      console.log(e);
      return res.send({
        obj: null,
        success: false,
        msg: "Erro ao atualizar",
        error: e.message,
      })
    }
  },
  async updateQrCodeOptionalName(req, res) {
    const itemUpdate = req.body
    if (itemUpdate.store_id !== req.stores[0]._id) {
      return res.send({
        obj: null,
        success: false,
        msg: "QrCode de outro cardapio.",
      });
    }
    const qrcode = await QrCodesModel.findById(itemUpdate._id);
    if (qrcode) {
      qrcode.optional_name = itemUpdate.optional_name;
      qrcode.markModified('optional_name')
      qrcode.save();
      return res.send({
        success: true,
        msg: "Qrcode alterado."
      })
    }
    return res.send({
      success: false,
      msg: "Qrcode não foi encontrado."
    })
  },
  async deleteQrCode(req, res) { },
  async recoverQrCode(req, res) { //Recuperar qrcodes do pedido. Alto risco
    if (req.body.qrcode) {
      try {
        const qrcode = await QrCodesModel.find({ pedido_id: req.body.qrcode, state: true, withdraw: false })
        if (qrcode) {
          if (!qrcode[0].state) {
            return res.send({ success: false, msg: "QrCode já utilizado" })
          }
          var type = false;
          var qrcodes_to_complete = []
          console.log(qrcode.length)

          for (let i = 0; i < qrcode.length; i++) {
            if (qrcode[i].QrImage === "") {
              type = qrcode[i].item.type;
              qrcodes_to_complete.push(qrcode[i])
            }
          }
          console.log(qrcodes_to_complete)
          await QrCodesModel.findByIdAndUpdate({ _id: qrcode[0]._id }, qrcode[0])
          if (type) {
            return res.send({ success: true, msg: "Pedido localizado", obj: qrcode, isType: type, objectType: qrcodes_to_complete })
          } else {
            return res.send({ success: true, msg: "Pedido localizado", obj: qrcode, isType: false, objectType: null })
          }

        } else {
          return res.send({ success: false })
        }
      } catch (e) {
        console.log(e)
        return res.send({ success: false, error: true })
      }

    }
  },
  async qrCodeTicketUpdate(req, res) {
    const request = req.body.itemData;
    try {
      var dataToSend = [];
      var aux_dataToSend = [];
      for (let i = 0; i < request.length; i++) {
        let qrCode = await QrCodesModel.findOne({ _id: request[i]._id, state: true })
        if (qrCode) {
          //Criar imagem, alterar descrição, atualizar qrcode

          qrCode.user_cpf = request[i].user_cpf;
          qrCode.user_name = request[i].user_name;
          qrCode.item.description = qrCode.item.description + " - Nome: " + request[i].user_name + " - CPF: " + request[i].user_cpf
          let datatoEncrypt = {
            _id: qrCode._id,
            store_id: qrCode.store_id,
          };

          let texto = Encrypter.encrypt(datatoEncrypt);
          let code = qr.imageSync(texto, {
            type: "png",
            size: 10,
          });


          let base64data = Buffer.from(code, "binary").toString("base64");

          qrCode.QrImage = base64data;
          let object = {
            qrcode: base64data,
            data: qrCode,
          };
          dataToSend.push(object);

          await QrCodesModel.findByIdAndUpdate(
            { _id: qrCode._id },
            qrCode
          );
          aux_dataToSend.push(qrCode)
        }
      }
      if (dataToSend.length > 0) {
        await sendQrCodeUpdates(dataToSend)
        console.log("Retornando")
        return res.send({ success: true, msg: "QrCode gerado", obj: aux_dataToSend })
      } else {
        return res.send({ success: false, msg: "Ocorreu um erro" })
      }
    } catch (e) {
      console.log(e)
      return res.send({ msg: "Ocorreu um erro", success: false })
    }
  },
  async generateQrCode(req, res) {
    try{
      const itemModel = await itemsModel.findById(req.body._id)
    if (itemModel) {
      aux_ticket = {
        item: itemModel,
        user_id: req.user_id,
        user_phone: "Adquirido na Portaria",
        user_email: "none",
        pedido_id: "Adquirido na portaria",
        cortesia: false,
        company_id: req.company_id,
        store_id: req.stores[0],
        store_name: "Estação Caxara", //MUDAR DEPOIS
        trava: itemModel.trava, //TRAVA DE SEGURANÇA - NOVA
        quantity: 1,
        QrImage: "",
        state: true,
        devedor: {
          cpf: "Adquirido na Portaria",
          nome: "Adquirido na Portaria"
        }
      };
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
        await QrCodesModel.findByIdAndUpdate(
          { _id: ticket._id },
          ticket
        );
        if(QrCodesModel){
          return res.send({obj:object, msg: "QrCode Gerado", success:true})
        }else{
          return res.send({success:false, msg: "Falhou ao salvar"})
        }
        
    }
    }catch(e){
      console.log(e)
      return res.send({success:false, msg: "Um erro ocorreu"})
    }
    
  },
  async generateCortesia(req,res){
    const dados = req.body.itemData;
    //Primeiro autenticar os dados, verificar items
    try {
      const items = [];
      //VERIFICAR SE STORE EXISTE PRIMEIRO
      const store = await storeModel.findById(req.stores[0]._id);
      //Verificações de segurança
      if (store) {
        if (store.company_id !== req.company_id) {
          return res.send({
            success: false,
            msg: "Erro 801",
            obj: null,
          });
        }
        //Buscar e comparar se este usuário é o dono e esta gerando cortesia.
        const userChecker = await userModel.findById({ _id: req.userID });
        if (userChecker.type !== "Owner") {
          return res.send({
            success: false,
            msg: "Usuário não é Dono.",
            obj: null,
          });
        }
        for (let i = 0; i < dados.length; i++) {
          let itemChecker = await itemsModel.findById({
            _id: dados[i]._id,
          });
          for (let y = 0; y < dados[i].qtd_qrcodes; y++) { //LAÇO PARA CADA ITEM TEM SUA QUANTIDADE DE QRCODES PARA CRIAR.
            if (itemChecker !== undefined) {
              //Este item existe. Guardar ele em uma variavel diferente para não haver discrepancias nos dados.
              itemChecker.qtd = dados[i].qtd;
              let aux_pusher = {
                _id: itemChecker._id,
                item_name: itemChecker.item_name,
                description: itemChecker.description,
                type: itemChecker.type,
                image_url: itemChecker.image_url,
                price: itemChecker.price,
                qtd: dados[i].qtd,
                trava: itemChecker.trava,
                ncm: itemChecker.ncm,
                icms: itemChecker.icms,
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
        if (items.length > 0) {
          //Se existir items validados continue
          //CRIAR UM PEDIDO COM OS ITEMS
          let object = {
            items: items,
            user_id: req.userID,
            cortesia: true,
            txid: "",
            price: "0",
            store_name: store.name,
            store_id: store._id,
            company_id: req.company_id,
          };
          const pedido = await pedidosModel.create(object);
          if (pedido) {
            //Criar QRCODES
            var aux_ticket = {};
            for (let i = 0; i < pedido.items.length; i++) {
              aux_ticket = {
                item: pedido.items[i],
                user_id: pedido.user_id,
                user_phone: pedido.user_phone,
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
              await QrCodesModel.findByIdAndUpdate(
                { _id: ticket._id },
                ticket
              );

            }
            return res.send({msg:"QRCODES CRIADOS", success:true}) 
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
  }
}
