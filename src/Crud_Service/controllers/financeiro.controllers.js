const sell_registry = require("../../models/sell_registry.model");
const financialModel = require("../../models/financial.model");
const drawReqModel = require("../../models/drawReq.model");
const contractModel = require("../../models/contract.model");
const storeModel = require("../../models/store.model")
const pedidoModel = require("../../models/pedidos.model")
const withdraw_func = require("./methods/withDrawFunction");
const qrCodeModel = require("../../models/qrCode.model");
const mailer = require("../../modules/NodeMailer.controllers");
const mailerconfig = require("../../config/NodeMailer.config");
const userModel = require("../../models/user.model");
module.exports = {
  async getNFE(req, res) {
    console.log(req.body)
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    var dataIni = new Date(req.body.dataIni).toUTCString();
    var dataFim = new Date(req.body.dataFim).toUTCString();
    //console.log(dataIni)
    const pedidos = await sell_registry.find({
      store_id: req.stores[0]._id,
      refund: false,
      createdAt: {
        $gte: dataIni,
        $lt: dataFim
      }
    })
    //console.log(pedidos)
    if (pedidos) {
      return res.status(200).send({
        obj: pedidos,
        success: true,
        msg: "Dados encontrados."
      })
    }

  },
  async withdrawRequest(req, res) {
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    const company = req.company_id; //VAI PRECISAR ALTERAR QUANDO CRIAR A FUNÇÃO DE LOJAS DUPLAS
    const store_id = req.stores[0]._id; //
    try {
      const response = await sell_registry.find({ store_id: store_id, draw: false, refund: false });
      if (response) {
        const financy = await financialModel.findOne({ company_id: company });
        var value = 0;

        if (financy) {

          if (financy.draw === true) {

            //Trazer dados do contrato.
            const contract = await contractModel.findById({ _id: financy.contract_id })

            if (!contract) {
              return res.send({ success: false, msg: "Contrato não foi localizado." })
            }
            //PERCORRER E VERIFICAR SE O REGISTRO É SACAVEL E O VALOR
            //Verificar se a data do proximo saque está liberada.
            let aux_date = new Date(financy.next_draw)
            let now = new Date(Date.now())

            if (now > aux_date) {

              for (let i = 0; i < response.length; i++) {
                if (!response[i].cortesia) {

                  value = parseFloat(value) + parseFloat(response[i].total);
                  response[i].draw = true;
                  await sell_registry.findByIdAndUpdate(
                    response[i]._id,
                    response[i]
                  );
                }
              }


              if (value > 0) {
                //Utilizar o contrato para conta.
                var tax = parseFloat(contract.tax) / 100;
                var tax_week = parseFloat(contract.tax_week) / 100;

                var earns = (parseFloat(value) * tax).toFixed(2);
                var aux_value = value;
                value = (parseFloat(value) - parseFloat(value) * tax).toFixed(2);
                if (financy.draw_type === "week") {
                  earns = (
                    parseFloat(earns) +
                    parseFloat(aux_value) * tax_week
                  ).toFixed(2);
                  value = (parseFloat(value) - parseFloat(value) * tax_week).toFixed(2);
                }


                let aux_draw = {
                  user_id: req.userID,
                  value: value,
                  earns: earns,
                  sellRegistries: response,
                  company_id: req.company_id,
                  status: false,
                };

                const drawRequest = await drawReqModel.create(aux_draw);

                if (drawRequest) {

                  financy.draw = false;
                  financy.last_draw = Date.now();
                  if (financy.draw_type === 'week') {
                    let aux = new Date(financy.last_draw)
                    aux.setDate(aux.getDate() + parseInt(contract.days))
                    financy.next_draw = aux
                  } else {
                    let aux = new Date(financy.last_draw)
                    aux.setDate(aux.getDate() + 30)
                    financy.next_draw = aux
                  }
                  const updater = await financialModel.findByIdAndUpdate(
                    financy._id,
                    financy
                  );
                  if (updater)
                    return res.send({
                      finance: financy,
                      obj: response,
                      success: true,
                      msg: "Pedido de saque criado",
                    });
                  return res.send({
                    success: false,
                    msg: "Não foi possivel criar o pedido de Saque.",
                  });
                } else {
                  return res.send({
                    success: false,
                    msg: "Não foi possivel criar o pedido de Saque",
                  });
                }
              } else {
                return res.send({
                  success: false,
                  msg: "Valor de saque está em Zero.",
                });
              }
            } else {
              return res.send({ success: false, msg: "Aguarde o tempo para o proximo saque" })
            }
          } else {

            return res.send({
              success: false,
              msg: "SemFila está verificando seu Ultimo Saque.",
            });
          }

        } else {

          return res.send({
            success: false,
            msg: "Não encontramos o seu financeiro"
          })
        }

      } else {
        return res.send({
          success: false,
          obj: "",
          msg: "Falha ao localizar",
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        obj: e.message,
        msg: "Um erro oorreu",
      });
    }
  },
  async fetchFinanceiroToday(req, res) { //Traz tudo sobre o financeiro, vendas e o contrato.
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    const company = req.company_id;
    const store_id = req.stores[0]._id;
    try {
      if (!req.body) {
        return res.send({
          success: false,
          msg: "Erro. 505",
        });
      }
      const financy = await financialModel.findOne({ company_id: company });
      if (!financy)
        return res.send({
          success: false,
          msg: "Não encontramos os dados da loja",
        });

      var aux_ini = new Date(new Date(req.body.today).toDateString())
      aux_ini.setUTCHours(0, 0, 0, 0);
      var dataIni = new Date(aux_ini).toUTCString();
      var aux_fim = new Date(new Date(req.body.today).toDateString())
      aux_fim.setDate(aux_fim.getDate() + 1);
      var dataFim = new Date(aux_fim).toUTCString();

      const response = await sell_registry.find({
        store_id: store_id,
        createdAt: {
          $gte: dataIni,
          $lt: dataFim
        }
      })

      if (response) {
        const contract = await contractModel.findById({ _id: financy.contract_id })
        if (contract) {
          return res.send({
            success: true,
            obj: response,
            finance: financy,
            contract: contract,
            msg: "Dados localizados",
          });
        }

      } else {
        return res.send({
          success: false,
          obj: "",
          msg: "Falha ao localizar o Financeiro",
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        obj: "",
        msg: "Erro",
        error: e.message,
      });
    }
  },
  async fetchFinanceiro(req, res) {
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    const store_id = req.stores[0]._id;
    try {
      if (!req.body.dataIni || !req.body.dataFim) {
        return res.send({
          success: false,
          msg: "Erro. 505",
        });
      }

      var aux_ini = new Date(new Date(req.body.dataIni).toDateString())
      aux_ini.setUTCHours(0, 0, 0, 0);
      var dataIni = new Date(aux_ini).toUTCString();

      var aux_fim = new Date(new Date(req.body.dataFim).toDateString())
      aux_fim.setUTCHours(23, 59, 59, 999);
      var dataFim = new Date(aux_fim).toUTCString();

      const response = await sell_registry.find({
        store_id: store_id,
        createdAt: {
          $gte: dataIni,
          $lt: dataFim
        }
      })

      if (response) {
        return res.send({
          success: true,
          obj: response,
          msg: "Dados localizados",
        });
      } else {
        return res.send({
          success: false,
          obj: "",
          msg: "Falha ao localizar o Financeiro",
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        obj: "",
        msg: "Erro",
        error: e.message,
      });
    }
  },
  async changeState(req, res) {
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    const state = req.body.itemData;
    const company = req.company_id;

    try {
      const financy = await financialModel.findOne({ company_id: company });
      if (financy) {
        console.log(financy);
        if (state) {
          financy.draw_type = "week";
        } else {
          financy.draw_type = "month";
        }
        const updater = await financialModel.findByIdAndUpdate(
          financy._id,
          financy
        );
        if (updater) {

          return res.send({
            success: true,
            msg: "Saque atualizado",
          });
        } else {

          return res.send({
            success: false,
            msg: "Erro ao atualizar o saque",
          });
        }
      } else {
        return res.send({
          success: false,

          msg: "Não foi possivel localizar Financeiro",
        });
      }
    } catch (e) {
      return res.send({
        success: false,
        obj: "",
        msg: "Erro ao alterar saque",
        error: e.message,
      });
    }
  },
  async reembolsoAction(req, res) {
    //Realizar reembolso quando a compra está completa. Devido a algum problema do cliente ou algo relacionado.
    //Somente o USUARIO Mestre pode realizar o pedido de estorno.
    //Só pode realizar um estorno caso não foi sacado.
    if (!req.authenticate) { //Somente usuário com permissão
      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    if (!req.body.sell_registry._id) {
      return res.json({
        success: false,
        msg: "Erro 305."
      });
    }

    const registry = await sell_registry.findOne({ _id: req.body.sell_registry._id, draw: false, cortesia: false, refund: false })

    if (!registry) {
      return res.json({
        success: false,
        msg: "Esta venda já foi sacada."
      });
    }
    //Enviar pedido e o valor para solicitar estorno.
    const pedido = await pedidoModel.findById({ _id: registry.pedido_id })
    if (!pedido) {
      return res.json({
        success: false,
        msg: "Pedido não encontrado."
      });
    }
    //
    try {
      
      if (pedido.payment === 'pix') {
        const response = await withdraw_func.withDrawPedido(pedido.pix_charge_id, registry.total); //REEMBOLSADOR

        if (response.success) { //Atualizar sell_registry e pedido para enviar via whatsapp
          pedido.canceled_amount = registry.total;
          pedido.markModified('canceled_amount')
          pedido.save();
          registry.refund = true;
          registry.markModified('refund')
          registry.save();

          return res.send({
            success: true,
            msg: "Reembolso realizado"
          })
        } else {
          return res.send({
            success: false,
            msg: response.msg
          })
        }
      } else { //É Cartão, então crie um pedido de reembolso padrão.
        if(pedido.payment === 'credit_card'){
          const qrcode = await qrCodeModel.findById({ _id: registry.qrcode_id });
        if (qrcode) {
          registry.refund = true;
          registry.markModified('refund')
          registry.save();
          qrcode.withdraw = true
          qrcode.markModified('withdraw')
          await qrcode.save();
          const user = await userModel.findById({ _id: qrcode.user_id })

          if (user) {

            let valor = (parseFloat(qrcode.item.price) * parseFloat(qrcode.quantity)).toFixed(2)
            let escopo = "Pedido de reembolso foi solicitado. "
            let mensagem = "O Reembolso do QRCODE vindo do pedido " + qrcode.pedido_id + " no valor de: R$" + valor + ", Foi solicitado. Aguarde 7 dias úteis para o reembolso ser emitido. Agradecemos pela experiência conosco e estamos sempre a sua disposição. Por SemFila."

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
          return res.send({
            success: true,
            msg: "Reembolso realizado"
          })
        }else{
          return res.send({
            success: false,
            msg: "Nao foi possivel encontrar o qrcode para reembolsar"
          })
        }
        }
        

      }

    } catch (e) {
      console.log(e.message)
      return res.send({
        success: false,
        msg: "Falha ao realizar reembolso",
      })
    }

    //


  },
  async dataFinanceiro(req,res){
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    const store_id = req.stores[0]._id;
    try{
      const ID_company = await storeModel.findById({_id: store_id})
      if(ID_company){
        const financy = await financialModel.findOne({ company_id: ID_company.company_id });
      if (!financy)
        return res.send({
          success: false,
          msg: "Não encontramos os dados da loja",
        });
        const contract = await contractModel.findById({ _id: financy.contract_id })
        if (contract) {
          return res.send({
            success: true,
            finance: financy,
            contract: contract,
            msg: "Dados localizados",
          });
        }else{
          return res.status(400).send({success:false, msg:"Não foi possível localizar os dados"})
        }
      }else{
        return res.status(400).send({success:false, msg:"Não foi possível localizar os dados"})
      }
      

    }catch(e){
      return res.status(404).send({success:false, msg:"Ocorreu um erro ao localizar os dados."})
    }
  }
};
