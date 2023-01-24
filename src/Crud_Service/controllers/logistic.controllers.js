const financialModel = require("../../models/financial.model");
const sell_registry = require("../../models/sell_registry.model");
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
                    msg: "Items carregados",
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
    async fetchLogisticToday(req, res) { //Busca logistica da sell_registry utilizando data de Hoje e amanhã
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
            var dataIni = new Date(new Date(req.body.today).toDateString()).toUTCString();
            var aux_fim = new Date(new Date(req.body.today).toDateString())
            aux_fim.setDate(aux_fim.getDate() + 1);
            var dataFim = new Date(aux_fim).toUTCString();
            console.log(dataIni)
            console.log(dataFim)
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
                    msg: "Items de hoje carregados.",
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
