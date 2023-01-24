const financialModel = require("../../models/menu.model");
const sell_registry = require("../../models/menu_category.model");
module.exports = {
    async fetchLogistic(req, res) { //Busca logistica da sell_registry utilizando datas
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
            var dataIni = new Date(req.body.dataIni).toUTCString();
            var dataFim = new Date(req.body.dataFim).toUTCString();

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
                    msg: "",
                });


            } else {
                return res.send({
                    success: false,
                    obj: "",
                    msg: "Falha ao localizar cardapio",
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
};
