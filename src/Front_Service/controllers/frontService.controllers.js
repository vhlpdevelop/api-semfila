const storeModel = require("../../models/store.model");
const userModel = require("../../models/user.model")
const pedido_model = require("../../models/pedidos.model")
const qrcode_model = require("../../models/qrCode.model")
const menuModel = require("../../models/menu.model")
const menu_category_model = require("../../models/menu_category.model");
const itemsModel = require("../../models/items.model");
const categoryModel = require("../../models/category.model");
const ratingModel = require("../../models/rating.model")
module.exports = {
    async search(req,res){
       
        try{
            const response = await storeModel.find({ name: {$regex: ".*"+req.query.query+".", $options:"i"} })
      
            res.send({
                obj: response
            })
        }catch(e){
            console.log(e.message)
            return ;
        }
    },
    async ratingCardapio(req,res){ //Adicionar voto
        try{
          //console.log(req.body)
          const user = await userModel.findById( {_id:req.userID})
          if(!user){
            return res.send({success:false, message:"Usuário não encontrado"})
          }
          const cardapio = await menuModel.findOne({store_id: req.body.menu_id})
          if(!cardapio){
            return res.send({success:false, message:"Cardapio não localizado."})
          }
          const rating = await ratingModel.findOne( { user_id: req.userID, menu_id: cardapio._id})
          if(rating){ //Caso tenha votado
            return res.send({success:false, message:"Você já fez sua avaliação neste cardapio."})
          }
          
          cardapio.ratings = req.body.rating;
          cardapio.markModified('ratings')
          cardapio.save();
          let construct ={
            user_id: user._id,
            store_id: req.body.store_id,
            user_email: user.email,
            ratings: req.body.rating,
      
            menu_id: cardapio._id,
          }
          const new_rating = await ratingModel.create(construct, {new:true})
          if(new_rating)
          return res.send({success:true, message:'Sua avaliação foi registrada'})
        }catch(e){
          return res.send({success:false, message:'Ocorreu um erro', error:e.message})
        }
    },
    async getStore(req, res) { //TRAZER CARDAPIO
    
      try {
        const response = await storeModel.findOne({ store_url: req.params.id });
      
  
        if (response) {
          if(!response.activate)
          return res.send({success:false, msg: "Esta loja foi desativada.", obj:""})
          //Buscar tudo da store, cardapio, items, etc
          const menu = await menuModel.findOne({
            store_id: response._id.toString(),
          });
  
          if (menu) {
            const menu_category = await menu_category_model.find({
              menu_id: menu._id.toString(),
            });
       
            const cardapio = [];
            for (let i = 0; i < menu_category.length; i++) {
              let aux_cardapio = await categoryModel.findOne({
                _id: menu_category[i].category_id,
              });
           
              var aux_items = [];
              if (aux_cardapio) {
                aux_items = await itemsModel.find({
                  category_id: menu_category[i].category_id.toString(),
                  
                });
               
                if(aux_cardapio.status === true){
                  var items_show = []
                  for(let y = 0; y<aux_items.length;y++){
                    if(aux_items[y].status){
                 
                      if(aux_items[y].limit_switch){
                        
                        if(aux_items[y].limit_number > 0){
                          items_show.push(aux_items[y])
                        }
                      }else{
                        items_show.push(aux_items[y])
                      }
                    }
                  }
                  let aux_category = {
                    _id: aux_cardapio._id,
                    category_name: aux_cardapio.category_name,
                    status: aux_cardapio.status,
                    items: items_show,
                  };
                  cardapio.push(aux_category);
                  
                }
              }
            }
            if(cardapio){
              let itemSend = {
                  store: response,
                  cardapio: cardapio
              }
              return res.send({success: true, obj: itemSend, rating:menu.ratings})
            }else{
              return res.send({success:false, msg: "Falha ao carregar", obj:""})
            }
  
          }
        }
        return res.send({success:false, msg: "Falha ao carregar", obj:""})
      } catch (error) {
          console.log(error)
        res.status(400).json({
          msg: error.message,
          ok: false,
        });
      }
    },
    async fetchPedido(req,res){
      try{
        const pedido_id = req.body.pedido_id;
        //console.log(pedido_id)
        const pedido = await pedido_model.findById({_id: pedido_id});
        if(pedido){//Localizou o pedido então buscar os QRCODES.
          //console.log("Encontrou")
          if(pedido.status){ //Está pago então buscar.
            const qrcodes = await qrcode_model.find({pedido_id: pedido._id})
            if(qrcodes){
              if(qrcodes.length > 0){
                return res.send({success:true, msg:"QRCODE carregado.", obj:qrcodes})
              }else{
                return res.send({success:false, msg:"Não existe QRCODES nesse pedido."})
              }
         
            
            }
          }else{
            return res.send({success:false, msg:"Aguardando pagamento."})
          }
        }else{
          return res.send({success:false, msg:"Pedido não encontrado"})
        }
      }catch(e){
        console.log(e)
        return res.send({success:false, msg: "Ocorreu um erro- 504"})
      }
    }
    
}