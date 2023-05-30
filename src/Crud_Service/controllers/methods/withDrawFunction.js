const axios = require("axios")
require("dotenv").config()
module.exports = {
    async withDrawPedido(pedido, valor) { //Reembolso pelo pedido
        var aux_valor = parseInt(valor.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, ''))
        var returned={
            success: false,
            msg: "Falha ao enviar reembolso"
        }
        try {
            await axios
        .delete(`https://api.pagar.me/core/v5/charges/`+pedido, {
          auth: {
            username: PAGARME_SECRET,
            password: "",
          },
          data: {
            amount: aux_valor
          }
        }).then( (res)=>{
            if(res.data.status === "processing"){
                returned.success = true;
                returned.msg ="Enviando Reembolso";
            }
        });
            return returned
        } catch (e) {
            console.log(e)
            console.log(e.message)
            return returned
        }
    },
}

const {
    PAGARME_SECRET
} = process.env
