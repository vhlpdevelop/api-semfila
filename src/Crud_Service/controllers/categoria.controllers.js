const menuModel = require("../../models/menu.model");
const menu_category_model = require("../../models/menu_category.model");
const itemsModel = require("../../models/items.model");
const categoryModel = require("../../models/category.model");

module.exports = {
  async allCategoria(req, res) {
    try {
      const flag = await allCategoria.find({ idMenu: req.params.idMenu });
      console.log(flag);
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
      console.log(flag);
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

  async newCategoria(req, res) {
    const newCategoria = req.body.category_name;

    //DEPOIS ALTERAR OS STORES PARA UNICO

    const store = req.stores[0];
   
    try {
      const menu = await menuModel.findOne({
        store_id: store._id.toString(),
      });
      if (menu) {
        let aux_category = {
          category_name: newCategoria,
          status: false,
        };
        const category = await categoryModel.create(aux_category);
        //console.log(category)
        if (category) {
          let aux = {
            menu_id: menu._id.toString(),
            category_id: category._id.toString(),
          };
          const menu_category = await menu_category_model.create(aux);

          if (menu_category) {
            return res.send({
              success: true,
              msg: "Categoria criada com sucesso",
              obj: category,
            });
          }
        } else {
          console.log("Falha ao criar categoria 2");
        }
      } else {
        console.log("Falha ao criar categoria 1");
      }
    } catch (error) {
      console.log(error);
      res.send({ error: error.message, ok: false });
    }
  },
  async deleteCategoria(req, res) {
    const categoria_id = req.body._id;
    console.log(categoria_id);
    try {
      const categoria = await categoryModel.findById(categoria_id);
      console.log(categoria);
      if (categoria) {
        console.log("Flag 1");
        let aux = await itemsModel.updateMany(
          { category_id: categoria_id },
          { $set: { category_id: "" } }
        );
        console.log(aux);

        let auxresponse = await menu_category_model.findOneAndDelete({
          category_id: categoria_id,
        });
        console.log(auxresponse);
        let response = await categoryModel.findByIdAndDelete(categoria_id);
        console.log(response);
        if (auxresponse && response)
          return res.status(200).send({ success: true });
      } else {
        console.log("Sem categoria");
        return res
          .status(400)
          .json({ success: false, msg: "Categoria já deletada" });
      }
    } catch (error) {
      res.send({ error: error.message, ok: false }); //mudar dps
    }
  },
  async updateCategoria(req, res) {
    const categoria = req.body.itemData;
    console.log(categoria);
    if(categoria !== "")
    try {
      delete categoria.items //REMOVER OS ITEMS
      console.log(categoria)
      const response = await categoryModel.findById(categoria._id);
      if (response) {
        const edit = await categoryModel.findByIdAndUpdate(
          categoria._id,
          categoria,
          {
            new: true,
          }
        );
        if(edit){
          return res.status(200).send({ success: true, msg: "Atualizado com sucesso" });
        }
      } else {
        console.log(response);
        return res.status(400).json({success: false, msg:"Falha ao atualizar" });
      }
    } catch (error) {
      res.send({ msg: "Erro", error: error.message, success: false }); //mudar dps
    }
  },
};
