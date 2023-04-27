//const menuModel = require("../models/menu.model");
const stripe = require('stripe')(process.env.STRIPE_CLIENT_SECRET)
const itemsModel = require("../../models/items.model");
const categoryModel = require("../../models/category.model");
const consumablesModel = require("../../models/consumables.model")
module.exports = {
  async search(req,res){
       
    try{
        const response = await consumablesModel.find({ name: {$regex: ".*"+req.query.query+".", $options:"i"} })
        res.send({
            obj: response
        })
    }catch(e){
        console.log(e.message)
        return ;
    }
},
  async allItems(req, res) {
    try {
      const flag = await allCategoria.find({ idMenu: req.params.idMenu });
      //console.log(flag);
      if (flag) {
        res.status(200).json({
          obj: flag,
          ok: true,
        });
      } else {
        res.status(200).json({
          obj: "",
          ok: false,
        });
      }
    } catch (error) {
      res.send({ msg: "Erro 400", obj: "" });
    }
  },
  //62e7071d8e30bf67e04af954
  //

  async oneCategoria(req, res) {
    try {
      const flag = await allCategoria.find({ idMenu: req.params.idMenu });
      //console.log(flag);
      //APOS TRAZER VERIFICAR
      if (!findProduct) {
        res.status(400).json({ ok: false, msg: "Item não encontrado" });
      }
      res.status(200).json(findProduct);
    } catch (error) {
      res.status(400).json({
        msg: error.message,
        ok: false,
      });
    }
  },

  async newItem(req, res) {
    const newItem = req.body;
    //console.log(newItem.category_id);

    try {
      const categoria = await categoryModel.findById({
        _id: newItem.category_id
      });
      //console.log(categoria._id)
      if (categoria) {
        let aux_price = newItem.item.price.replace(/[^0-9,]/g, "");
        aux_price = aux_price.replace(/,/g, ".");
        let aux_price_discount = newItem.discount_value.replace(/[^0-9,]/g, "");
        aux_price_discount = aux_price_discount.replace(/,/g, ".");
        let dataSAVE = {
          item_name: newItem.item.item_name,
          description: newItem.item.description,
          type: newItem.type,
          image_url: newItem.item.image_url,
          icms: newItem.item.icms,
          ncm: newItem.item.ncm,
          price: aux_price,
          status: newItem.status,
          category_id: categoria._id.toString(),
          company_id: req.company_id,
          promotion: newItem.promotion,
          discount_status: newItem.discount,
          discount_value: aux_price_discount,
          promotion_duration: newItem.promotion_duration,
          trava: newItem.trava,
          destaques: newItem.destaque,
        };
        const item = await itemsModel.create(dataSAVE);
        //console.log(item);
        if (item) {
          //Enviar ao stripe
          const product = await stripe.products.create({
            name: newItem.item.item_name,
            id: item._id
          })
          console.log(product)
          if(product){
            //Criar preço
            let aux_value = parseInt(aux_price.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')) //transformador de int
            console.log(aux_value)
            const price = await stripe.prices.create({
              unit_amount: aux_value,
              currency: 'brl',
              product: product.id,
            });
            console.log(price)
            if(price){ //Atualizar item
              item.id_pag = price.id
              var update_item = await itemsModel.findByIdAndUpdate(item._id, item)
              if(update_item){
                return res.send({
                  success: true,
                  msg: "Produto criado com sucesso",
                  obj: item,
                });
              }
            }
          }
         
        } else {
          console.log("Falha ao criar Item 2");
        }
      } else {
        console.log("Falha ao criar item 1");
      }
    } catch (error) {
      console.log(error);
      res.send({ error: error.message, ok: false });
    }
  },
  async deleteItem(req, res) {
    const itemData = req.body._id;
    
    try {
      const item = await itemsModel.findByIdAndDelete(itemData);
      if (item) {
        return res.status(200).send({obj: req.body, success:true, msg:"Item deletado"})
      } else {
        //console.log("Item não existe");
        return res
          .status(400)
          .json({ success: false, msg: "Item já deletado" });
      }
    } catch (error) {
      res.send({ error: error.message,  success: false, msg:"Erro desconhecido", obj:null }); //mudar dps
    }
  },
  async updateItem(req, res) {
    const itemData = req.body;
   
    try {
      const categoria = await categoryModel.findById(itemData.category_id);
      if (categoria) {
        let aux_price = itemData.price.replace(/[^0-9,]/g, "");
        aux_price = aux_price.replace(/,/g, ".");
        itemData.price = aux_price;
        const itemUpdate = await itemsModel.findByIdAndUpdate(itemData._id, itemData);
        if(itemUpdate)
        return res.status(200).send({obj: req.body, success:true, msg:"Item atualizado"})
        else
        return res.send({obj: req.body, success:false, msg:"Não foi possivel atualizar o item"})
      } else {
        //console.log("Categoria não existe, movendo item");
        itemData.category_id = '';
        let aux_update = await itemsModel.findByIdAndUpdate(itemData._id, itemData);
        if(aux_update)
        return res
          .status(200)
          .json({ success: false, msg: "Categoria já deletada, movendo item" });
        else
        return res.send({obj: req.body, success:false, msg:"Item não existe"})
      }
    } catch (error) {
      console.log(error.message)
      res.send({ error: error.message,  success: false, msg:"Erro desconhecido", obj:null }); //mudar dps
    }
  },
};
