const { GNRequest } = require("../../config/gerenciaNet.config");
module.exports = {
    async withDrawPedido(pedido, valor) { //Reembolso pelo pedido
        try {
            const reqGNAlready = GNRequest({
                clientID: process.env.GN_CLIENT_ID,
                clientSecret: process.env.GN_CLIENT_SECRET,
            });

            const reqGN = await reqGNAlready;
            const cobResponse = await reqGN.get(`/v2/cob/${pedido.txid}`);
            await reqGN.put(`/v2/pix/${cobResponse.data.pix[0].endToEndId}/devolucao/${pedido.txid}`, { valor: valor }) //ALTERAR DEPOIS
        } catch (e) {
            console.log(e.message)
            return { success: false, msg: "ocorreu um erro"}
        }
    },
}