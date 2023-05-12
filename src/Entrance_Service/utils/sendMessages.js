require("dotenv").config()
const axios = require("axios")
module.exports = {
    async sendConfirmPayMessage(pedido, items, url_button){
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
        await axios.post(APIZ_INSTANCE+'/send-link', {
            phone: pedido.user_phone,
            message: "Veja sua compra no nosso cardapio, apenas clique no link! https://www.semfila.app/resgate/"+url_button,
            image: "https://i.ibb.co/Df7vzhn/imagephone-2.png",
            linkUrl: "https://www.semfila.app/resgate/"+url_button,
            title:"SemFila",
            linkDescription: "Veja sua compra por aqui"
        })
       
      
    }
}

const {
    APIZ_INSTANCE
} = process.env

function MessageBuilder(item,phone){
    return {
        phone: phone,
        message: ""
    }
}

function ImageBuilder(item,phone){
    console.log(item)
    return {
        phone: phone,
        image: "data:image/png;base64,"+item.qrcode,
        caption: item.data.item.item_name + " " + item.data.quantity + " un em " + item.data.store_name
    }
}