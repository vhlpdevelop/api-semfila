const menuModel = require("../../models/menu.model");
const menu_category_model = require("../../models/menu_category.model")
const categoryModel = require("../../models/category.model");
const userModel = require("../../models/user.model")
const itemsModel= require("../../models/items.model")
const ratingModel = require("../../models/rating.model")
//const { default: mongoose } = require("mongoose");
module.exports = {
  async cardapio(req,res){

  },
  async updateItemStatus(req,res){
  
    try{
      if(req.body.legnth !== 0){
        const item = await itemsModel.findById({_id:req.body.objSend._id})
        
        if(item){
          
          item.status = req.body.objSend.status;
          
          await itemsModel.findByIdAndUpdate({_id:req.body.objSend._id}, item).then( (response) => {
            if(response){
              
              let aux = {
                index: req.body.index,
                item: item
              }
              return res.send({obj:aux, success:true, msg:"Item atualizado"})
            }else{
              return res.send({obj:item, success:false, msg:"Erro ao atualizar"})
            }
            
          })
        }
      }
    }catch(e){
      console.log(e)
      console.log('...')
      console.log(e.message)
    }
  },
  async updateCategoryStatus(req,res){
    
    try{
      if(req.body.legnth !== 0){
        const category = await categoryModel.findById({_id:req.body._id})
        
        if(category){
          
          category.status = req.body.status;
          
          await categoryModel.findByIdAndUpdate({_id:req.body._id}, category).then( (response) => {
            if(response){
              
              let aux = {
                category_name : category.category_name,
                status : category.status,
                _id : category._id.toString(),
                items : req.body.items
              }
              console.log(aux)
              return res.send({obj:aux, success:true, msg:"Categoria atualizada"})
            }else{
              return res.send({obj:"", success:false, msg:"Erro ao atualizar"})
            }
            
          })
        }
      }else{
        return res.send({obj:'', success:false, msg:"BODY EMPTY"})
      }
    }catch(e){
      console.log(e)
      console.log('...')
      console.log(e.message)
    }
  },
  async fetchCardapio(req, res) {
    //ZONA DE TESTE
    
    
    try {
      //console.log(req.stores[0])
      let aux_menu = req.stores[0]
      console.log("STORE ===>")
      console.log(aux_menu)
      
      const menu = await menuModel.findOne({store_id : aux_menu._id})
      if(!menu){
        return res.send({msg:"Cardapio vazio" ,success:true});
      }
      const menu_category = await menu_category_model.find({menu_id:menu._id.toString()})
      //console.log("flag 1")
      //console.log(menu_category.length)
      const cardapio = [];
      for(let i=0; i<menu_category.length;i++){
        let aux_cardapio = await categoryModel.findOne({_id:menu_category[i].category_id })
        //console.log("flag 2")
       // console.log(aux_cardapio)
        let aux_items=''
        if(aux_cardapio){
          //console.log("flag 3")
            aux_items = await itemsModel.find({category_id:menu_category[i].category_id.toString()})
            let aux_category={
                _id: aux_cardapio._id,
                category_name: aux_cardapio.category_name,
                status: aux_cardapio.status,
                items: aux_items
            }
            cardapio.push(aux_category)
        }else{
            return res.send({success: false, msg:"falha critica"})
        }
        
        
        
            /*
            let aux_cardapio = await categoryModel.aggregate([
            {$lookup:  {from: "items", pipeline:[{$match : { category_id: menu_category[0].category_id.toString() } }] ,as:"items"}},
            {$lookup:  {from: "category", pipeline:[{$match : { _id:mongoose.Types.ObjectId(menu_category[0].category_id) } }] ,as:"category"}},
            {$unwind: {path:"$category"}},
            {$unwind: {path: "$items"}}
            ])
            //
            { $project: { union: { $concatArrays: ["$items", "$category"] } } },
            { $unwind: '$union' },
            { $replaceRoot: { newRoot: '$union' } }
            */
        
        /*
        if(aux_cardapio){
            let aux_category={
                category_name: aux_cardapio.category_name,
                status: aux_cardapio.status
            }
            cardapio.push(aux_cardapio)
        }
            
            console.log("FOI")
            
            console.log(aux_items)
        */
            
        /*
        
        */
      }
      if(cardapio){
        return res.send({success: true, obj: cardapio, msg:"Cardapio Carregado"})
      }else{
        return res.send({success:true, msg: "Sem categoria", obj:""})
      }
      
    } catch (e) {
      console.log(e)
      console.log('...')
      console.log(e.message)
    }
  },
  async ratingCardapio(req,res){ //Adicionar voto? 
    try{
      console.log(req.body)
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
  }
};
