const sell_registry = require("../../models/sell_registry.model");
const financialModel = require("../../models/financial.model");
const drawReqModel = require("../../models/drawReq.model");


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
      const response = await sell_registry.find({ store_id: store_id });
      if (response) {
        const financy = await financialModel.findOne({ company_id: company });
        var value = 0;
        if (financy)
          if (financy.draw) {
            //PERCORRER E VERIFICAR SE O REGISTRO É SACAVEL E O VALOR
            //Verificar se a data do proximo saque está liberada.
            let aux_date = new Date(financy.next_draw)
            let now = new Date(Date.now())
            if (now > aux_date) {

              for (let i = 0; i < response.length; i++) {
                if (!response[i].cortesia) {
                  if (response[i].draw) {
                    value = parseFloat(value) + parseFloat(response[i].total);
                    response[i].draw = true;
                    await sell_registry.findByIdAndUpdate(
                      response[i]._id,
                      response[i]
                    );
                  }
                }
              }


              if (value > 0) {
                var earns = (parseFloat(value) * 0.05).toFixed(2);
                var aux_value = value;
                value = (parseFloat(value) - parseFloat(value) * 0.05).toFixed(2);
                if (financy.draw_type === "week") {
                  earns = (
                    parseFloat(earns) +
                    parseFloat(aux_value) * 0.01
                  ).toFixed(2);
                  value = (parseFloat(value) - parseFloat(value) * 0.01).toFixed(
                    2
                  );
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
                    aux.setDate(aux.getDate() + 7)
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
            }


          }
        return res.send({
          success: false,
          msg: "SemFila está verificando seu Ultimo Saque.",
        });
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
  async fetchFinanceiroToday(req, res) {
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
        return res.send({
          success: true,
          obj: response,
          finance: financy,
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
  async fetchFinanceiro(req, res) {
    if (!req.authenticate) {

      return res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
    }
    const company = req.company_id;
    const store_id = req.stores[0]._id;
    try {
      if (!req.body.dataIni || !req.body.dataFim) {
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
          finance: financy,
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
          console.log("Ok")
          return res.send({
            success: true,
            msg: "Saque atualizado",
          });
        } else {
          console.log("nao ok")
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
};
