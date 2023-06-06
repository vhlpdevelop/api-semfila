require("dotenv").config()
const axios = require("axios")
module.exports = {
    async sendConfirmPayMessage(pedido, items, url_button, type){
        //Receber objeto item e tratar com messageBuilder e depois enviar.
        for(let i =0; i < items.length; i++){
            try{
                await axios.post(APIZ_INSTANCE+'/send-image', ImageBuilder(items[i],pedido.user_phone))
            }catch(e){
                console.log("ERRO IMAGEM ==>")
                console.log(e)
            }
        }

        //Enviar link para visualização direto pelo sistema
        try{
            if(type){
                await axios.post(APIZ_INSTANCE+'/send-text', {phone:pedido.user_phone,message:"Para finalizar a inscrição do(s) ingresso(s), abra o link abaixo. Os qrcodes serão enviados para este mesmo número "})
                await axios.post(APIZ_INSTANCE+'/send-text', {phone:pedido.user_phone,message:"https://www.semfila.app/resgate/"+url_button})
            }else{
                await axios.post(APIZ_INSTANCE+'/send-link', {
                    phone: pedido.user_phone,
                    message: "Veja sua compra no nosso cardapio, apenas clique no link! https://www.semfila.app/resgate/"+url_button,
                    image: "https://i.ibb.co/Df7vzhn/imagephone-2.png",
                    linkUrl: "https://www.semfila.app/resgate/"+url_button,
                    title:"SemFila",
                    linkDescription: "Veja sua compra por aqui"
                })
            }
            
        }catch(e){
            console.log("ERRO LINK ==>")
            console.log(e)
        }
       
       
      
    },
    async sendRefundMessage(pedido){
      
        try{
            await axios.post(APIZ_INSTANCE+'/send-text', MessageBuilderRefund(pedido))
        }catch(e){
            console.log("ERRO MESSAGE REFUND ==>")
            console.log(e)
        }
        
    }
}

const {
    APIZ_INSTANCE
} = process.env

function MessageBuilderRefund(pedido){
    return {
        phone: pedido.user_phone,
        message: "Valor foi estornado direto para sua conta como solicitado no valor de: R$"+pedido.canceled_amount+". Obrigado por usar a SemFila, estaremos sempre prontos para você!"
    }
}

function ImageBuilder(item,phone){

    return {
        phone: phone,
        image: "data:image/png;base64,"+item.qrcode,
        caption: item.data.item.item_name + ", " + item.data.quantity + " un(s) em " + item.data.store_name
    }
}