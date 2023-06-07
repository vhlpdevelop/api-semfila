require("dotenv").config()
const axios = require("axios")
module.exports = {
    async sendQrCodeUpdates(items){
        for(let i =0; i < items.length; i++){
            try{
                await axios.post(APIZ_INSTANCE+'/send-image', ImageBuilder(items[i],items[i].data.user_phone))
              
            }catch(e){
                console.log("ERRO IMAGEM ==>")
                console.log(e)
            }
        }
        await axios.post(APIZ_INSTANCE+'/send-text', {phone:items[0].data.user_phone,message:"Atenção, os ingressos são únicos e não podem ser alterados. \n"
        +" Obrigado por usar a SemFila!"})
    },
}

const {
    APIZ_INSTANCE
} = process.env

function ImageBuilder(item,phone){
    return {
        phone: phone,
        image: "data:image/png;base64,"+item.qrcode,
        caption: item.data.item.item_name + ", " + item.data.quantity + " un(s) em " + item.data.store_name+ "\n"+
        "Nome -"+item.data.user_name+ "\n"+"CPF -"+item.data.user_cpf
    }
}