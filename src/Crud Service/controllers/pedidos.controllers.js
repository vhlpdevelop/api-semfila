const pedidoModel = require('../../models/pedidos.model')
const storeModel = require("../../models/store.model");
const userModel = require("../../models/user.model");

module.exports = {
    async fetchPedidos(req, res){
      console.log("Aqui")
        try {
          let store = await storeModel.findById(req.stores[0]._id);
          //Verificações de segurança
          if (store._id !== undefined) {
            if(store.company_id !== req.company_id){
              return res.send({
                success: false,
                msg: "Erro 801",
                obj: null,
              });
            }
            //Buscar e comparar se este usuário é o dono e esta gerando cortesia.
            let userChecker = await userModel.findById( {_id : req.userID} );
            if(!userChecker){
              return res.send({
                success: false,
                msg: "Usuário não existente",
                obj: null,
              });
            }
            
            if(userChecker.type !== "Owner"){
              return res.send({
                success: false,
                msg: "Usuário não é Dono.",
                obj: null,
              });
            }

            const pedidos = await pedidoModel.find( {store_id: req.stores[0]._id, user_id: req.userID, cortesia:true});
            console.log(pedidos)
            if(pedidos){
              return res.status(200).send({
                success: true,
                msg: "Histórico carregado",
                obj: pedidos,
              })
            }
          }else{
            return res.send({
              success: false,
              msg: "Loja não existe",
              obj: null,
            });
          }
            
          } catch (error) {
            console.log(error)
            res.send({ msg: "Erro 1001", obj : '', ok:false });
          }
    },
    async savePedido(req,res){
        return null
    },
    async updatePedido(req,res){
        const pedido = req.body
      try {
        const response = await pedidoModel.findById(pedido._id)
        if(response){
            const edit = await pedidoModel.findByIdAndUpdate(pedido._id, pedido, {
              new: true,
            });
            if(edit){
                console.log(pedido)
                const historico = await historicoModel.findById(pedido.id_historico)
                if(historico){
                    var index = historico.historico.findIndex(
                        (item) => item.order_id === pedido.order_id
                    )
                    console.log(index)
                    if(index > -1){
                        historico.historico[index].items = pedido.items
                        historico.historico[index].envio = pedido.envio
                        historico.historico[index].id_rastreamento = pedido.id_rastreamento
                        await historicoModel.findByIdAndUpdate(historico._id, historico, {
                            new: true
                        })
                    }
                }
            }
            return res.status(200).send({ok: true})
        }else{
            console.log(response)
            return res.status(400).json({ok:false})
        }
        
      } catch (error) {
        res.send({ msg: servico, error: error.message, ok: false }); //mudar dps
      }
    },
    async deletePedido(req,res){
        const pedido = req.body.id
    //console.log(product)
      try {
        const response = await pedidoModel.findById(pedido)
        if(response){
            await pedidoModel.findByIdAndDelete(pedido);
            await historicoModel.findByIdAndDelete(response.id_historico)

            return res.status(200).send({ok: true})
        }else{
            console.log(response)
            return res.status(400).json({ok:false})
        }
        
      } catch (error) {
        res.send({ error: error.message, ok: false }); //mudar dps
      }
    },
}