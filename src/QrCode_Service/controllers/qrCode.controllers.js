const QrCodesModel = require("../../models/qrCode.model");
const Encrypter = require("./methods/Encrypter");
const sellRegistryModel = require("../../models/sell_registry.model");
const User_model = require("../../models/user.model");
const storeModel = require("../../models/store.model");
const userModel = require("../../models/user.model");
const mailer = require("../../modules/NodeMailer.controllers");
const mailerconfig = require("../../config/NodeMailer.config");

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
      const qrcodes = await QrCodesModel.find({ user_id: req.userID });
      var array_toSend = [];
      var trigger = false;
      for (let i = 0; i < qrcodes.length; i++) {
        if (qrcodes[i].state) {
          if (qrcodes[i].quantity > 0) {
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
          if (QrCode.state) {
            console.log(QrCode.item.promotion)
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
          msg: "QrCode Inválido",
          error: e.message,
        });
      }
    } else {
      res.send({ obj: null, success: false, msg: "QrCode Inválido" });
    }
  },
  async updateQrCode(req, res) {
    const itemUpdate = req.body;

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
      const qrcode = await QrCodesModel.findById(itemUpdate._id);
      if (qrcode) {
        //Caso existe verificar store_id e quantidade pedida
        if (qrcode.withdraw) { //Caso o QrCode foi solicitado para reembolso.
          return res.send({
            obj: null,
            success: false,
            msg: "QrCode em processo de Reembolso.",
          });
        }

        if (qrcode.quantity >= itemUpdate.quantity && itemUpdate.quantity > 0) {
          //Verificar se é maior q 0

          //ALTERAR QRCODE E SALVAR NO REGISTRO
          qrcode.quantity = qrcode.quantity - itemUpdate.quantity;
          if (qrcode.quantity < 0) {//Nunca se sabe
            console.log("Flag 2")
            return res.send({
              obj: null,
              success: false,
              msg: "Erro 712 - Qtd negativa.",
            });
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
            pedido_id: qrcode.pedido_id,
            company_id: req.company_id,
            store_id: req.stores[0]._id, //ARRUMAR
            qrcode_id: qrcode._id,
            devedor: { //NOVO
              nome: qrcode.devedor.nome,
              cpf: qrcode.devedor.cpf
            },
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

            if (qrcodeUpdater) {
              //console.log("Foi");
              return res.send({
                obj: qrcode,
                success: true,
                msg: "Retirado :" + itemUpdate.quantity + " item(s)",
              });
            } else {
              const removeUpdate = await sellRegistryModel.findByIdAndDelete(
                sellRegistry._id
              );
              if (removeUpdate) {
                return res.send({
                  obj: null,
                  success: false,
                  msg: "Falha ao gravar no sistema",
                });
              } else {
                return res.send({
                  obj: null,
                  success: false,
                  error:
                    "Erro critico no sistema ao deletar registro de venda após qrcode não ser criado.",
                  msg: "Erro Critico",
                });
              }
            }
          } else {
            return res.send({
              obj: null,
              success: false,
              msg: "Falha ao gravar no sistema",
            });
          }
        } else {
          return res.send({
            obj: null,
            success: false,
            msg: "Sem itens no qrcode",
          });
        }
      } else {

        return res.send({
          obj: null,
          success: false,
          msg: "QrCode não localizado",
        });
      }
    } catch (e) {
      console.log(e);
      res.send({
        obj: null,
        success: false,
        msg: "Erro ao atualizar",
        error: e.message,
      });
    }
  },
  async deleteQrCode(req, res) { },
  async recoverQrCode(req, res) { //Recuperar qrcode.
    if (req.body.qrcode) {
      try {
        const qrcode = await QrCodesModel.findById({ _id: req.body.qrcode })
        if (qrcode) {
          return res.send({ success: true, msg: "Qrcode localizado", obj: qrcode })
        } else {
          return res.send({ success: false })
        }
      } catch (e) {
        console.log(e)
        return res.send({ success: false, error: true })
      }

    }
  }
};
