const itemsModel = require("../../models/items.model")
const limitModel = require("../../models/limit.model")
module.exports = {
  async switchLimit(req, res) { //Alterar ativo ou desativo
    try {
      if (!req.authenticate) {
        return res.json({
          success: false,
          msg: "Usuário não tem permissão."
        });
      }
      if (req.body.item && typeof (req.body.switch) === 'boolean') {
        const item = await itemsModel.findById({ _id: req.body.item }) //req.body.item = ID.
        if (!item) {
          return res.json({
            success: false,
            msg: "Item não encontrado."
          });
        }

        item.limit_switch = req.body.switch //FALSE OU TRUE;
       
        item.markModified('limit_switch');
        item.save(); //SALVAR
        return res.send({
          success:true,
          msg:"Limitador alterado."
        })
      } else {
        return res.json({
          success: false,
          msg: "Item vazio."
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
  async createLimit(req, res) {
    try {
      if (!req.authenticate) {
        return res.json({
          success: false,
          msg: "Usuário não tem permissão."
        });
      }
      if (req.body.item && req.body.item.limit < 3000 &&  req.body.item.limit >= 0) {
        const item = await itemsModel.findById({ _id: req.body.item._id }) //req.body.item = ID.
        if (!item) {
          return res.json({
            success: false,
            msg: "Item não encontrado."
          });
        }

        item.limit_status = true //FALSE OU TRUE;
        item.limit = req.body.item.limit;
        item.save(); //SALVAR
        let aux_limit ={
          item_id: item._id,
          limit_number: item.limit,
          status:item.status,
        }
        await limitModel.create(aux_limit)
        return res.send({
          success:true,
          msg:"Limitador criado."
        })
      } else {
        return res.json({
          success: false,
          msg: "Item vazio."
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
  async updateLimit(req, res) { //Adicionar ou diminuir Limite atual.
    try {
      if (!req.authenticate) {
        return res.json({
          success: false,
          msg: "Usuário não tem permissão."
        });
      }
      if (req.body._id && req.body.limit < 3000 &&  req.body.limit >= 0) {
        const item = await itemsModel.findById({ _id: req.body._id }) //req.body.item = ID.
        if (!item) {
          return res.json({
            success: false,
            msg: "Item não encontrado."
          });
        }
     
        item.limit_number = item.limit_number + parseInt(req.body.limit); //ADICIONA OU DIMINUI
        item.markModified('limit_number')
        item.save(); //SALVAR

        //Criar no Limit um update.
        let aux_limit ={
          item_id: item._id,
          limit_number: item.limit_number,
          status:item.limit_switch,
        }
        await limitModel.create(aux_limit)
        return res.send({
          success:true,
          msg:"Limitador atualizado."
        })
      } else {
        return res.json({
          success: false,
          msg: "Item vazio."
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
  async fetchHistoricoLimit(req,res){ //Buscar historico de alteração do estoque
    if (!req.authenticate) {
      return res.json({
          success: false,
          msg: "Usuário não tem permissão."
      });
  }
  try {
      if (!req.body) {
          return res.send({
              success: false,
              msg: "Erro. 605",
          });
      }
 
      var aux_ini = new Date(new Date(req.body.dataIni).toDateString())
      aux_ini.setUTCHours(0,0,0,0);
      var dataIni = new Date(aux_ini).toUTCString();

      var aux_fim = new Date(new Date(req.body.dataFim).toDateString())
      aux_fim.setUTCHours(23,59,59,999);
      var dataFim = new Date(aux_fim).toUTCString();

      const response = await limitModel.find({
          item_id: req.body.item_id,
          createdAt: {
              $gte: dataIni,
              $lt: dataFim
          }
      })
      if (response) {
          return res.send({
              success: true,
              obj: response,
              msg: "Histórico carregado.",
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
          obj: "",
          msg: "Erro",
          error: e.message,
      });
  }
  }
};
