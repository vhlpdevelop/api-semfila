const { GNRequest } = require("../../config/gerenciaNet.config");
const mailer = require("../../../modules/NodeMailer.controllers");
const mailerconfig = require("../../../config/NodeMailer.config");
module.exports = {
    async withDrawPedido(pedido, i) { //Reembolso pelo pedido
        try {
            const reqGNAlready = GNRequest({
                clientID: process.env.GN_CLIENT_ID,
                clientSecret: process.env.GN_CLIENT_SECRET,
            });

            const reqGN = await reqGNAlready;
            const cobResponse = await reqGN.get(`/v2/cob/${pedido.txid}`);
            await reqGN.put(`/v2/pix/${cobResponse.data.pix[0].endToEndId}/devolucao/${pedido.txid}`, { valor: '0.10' }) //ALTERAR DEPOIS
            if (pedido.user_email) { //Caso tenha um usuario enviar um email
                let escopo = "Infelizmente realizamos um reembolso inesperado. "
                let mensagem = "O Reembolso vindo do pedido " + pedido._id + " no valor de: R$" + pedido.price +
                    ". Sentimos muito, mas o Estoque do item- "+pedido.items[i].item_name+"  está zerado, por isso estamos realizando seu reembolso. Por SemFila."
                mailer.sendMail(
                    {
                        to: pedido.user_email,
                        from: mailerconfig.from,
                        template: "EmailTemplateBasic",
                        subject: "SemFila - Reembolso automático efetuado.",
                        context: { escopo, mensagem },
                    },
                    (err) => {
                        if (err) {
                            console.log(err);
                            return { success: false, msg: err.message }
                        }
                    }
                );

            }

            return { success: true }
        } catch (e) {
            console.log(e.message)
            return { success: false, msg: "ocorreu um erro"}
        }
    },
    async withDrawLostItem(pedido) {
        try {
            const reqGNAlready = GNRequest({
                clientID: process.env.GN_CLIENT_ID,
                clientSecret: process.env.GN_CLIENT_SECRET,
            });
            console.log(pedido.price)
            const reqGN = await reqGNAlready;
            const cobResponse = await reqGN.get(`/v2/cob/${pedido.txid}`);
            //valor: pedido.price
            const pix = await reqGN.put(`/v2/pix/${cobResponse.data.pix[0].endToEndId}/devolucao/${pedido.txid}`, { valor: '0.10' })
            if (pedido.user_email) { //Caso tenha um usuario enviar um email
                let escopo = "Infelizmente realizamos um reembolso inesperado. "
                let mensagem = "O Reembolso vindo do pedido " + pedido._id + " no valor de: R$" + valor +
                    ". Sentimos muito, mas um item não foi encontrado, por isso realizamos seu reembolso. Por SemFila."
                mailer.sendMail(
                    {
                        to: pedido.user_email,
                        from: mailerconfig.from,
                        template: "EmailTemplateBasic",
                        subject: "SemFila - Reembolso efetuado.",
                        context: { escopo, mensagem },
                    },
                    (err) => {
                        if (err) {
                            console.log(err);
                            return { success: false, msg: err.message }
                        }
                    }
                );

            }
            return { success: true }
    } catch(e) {
        
        return { success: false, msg: "ocorreu um erro"}
    }
}
}