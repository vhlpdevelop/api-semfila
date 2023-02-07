const { GNRequest } = require("../../config/gerenciaNet.config");
module.exports = {
    async withDrawPedido(pedido, valor) { //Reembolso pelo pedido
        try {
            const reqGNAlready = GNRequest({
                clientID: process.env.GN_CLIENT_ID,
                clientSecret: process.env.GN_CLIENT_SECRET,
            });
            console.log(valor)
            const reqGN = await reqGNAlready;
            const cobResponse = await reqGN.get(`/v2/cob/${pedido.txid}`);
            const data = await reqGN.put(`/v2/pix/${cobResponse.data.pix[0].endToEndId}/devolucao/${pedido.txid}`, { valor: "0.10" }) //ALTERAR DEPOIS
            console.log(data.data)
        } catch (e) {
            console.log(e)
            console.log(e.message)
            return { success: false, msg: "ocorreu um erro"}
        }
    },
}