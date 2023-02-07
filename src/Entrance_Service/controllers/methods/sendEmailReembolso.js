
const mailer = require("../../../modules/NodeMailer.controllers");
const mailerconfig = require("../../../config/NodeMailer.config");
module.exports = {
    async refundEmail(pedido, valor, email) { //Reembolso pelo pedido
        try {
                let escopo = "Reembolso efetuado com sucesso."
                let mensagem = "O Reembolso vindo do pedido " + pedido + " no valor de: R$" + valor +
                    +"Não responda este email. Apenas estamos lhe informando que o reembolso foi efetuado com sucesso, obrigado. Por SemFila."
                mailer.sendMail(
                    {
                        to: email,
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
            return { success: true }
        } catch (e) {
            console.log(e.message)
            return { success: false, msg: "ocorreu um erro"}
        }
    },
}