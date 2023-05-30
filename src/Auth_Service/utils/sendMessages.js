require("dotenv").config()
const axios = require("axios")
module.exports = {
    async sendConfirmToken(token, user_name, user_phone){
        console.log(token)
        console.log(user_name)
        console.log(user_phone)
        try{
            await axios.post(APIZ_INSTANCE+'/send-text', MessageBuilderRegular(user_name, user_phone))
        }catch(e){
            console.log("ERRO MESSAGE AUTH ==>")
            console.log(e)
        }
        try{
            await axios.post(APIZ_INSTANCE+'/send-link', {
                phone: phone,
                message: "Autentique sua conta agora clicando no link \n  https://semfila.app/"+token+"/autenticar",
                image: "https://i.ibb.co/Df7vzhn/imagephone-2.png",
                linkUrl: `https://semfila.app/${token}/autenticar`,
                title:"SemFila",
                linkDescription: "Autentique sua conta"
            })
        }catch(e){
            console.log("ERRO LINK AUTH ==>")
            console.log(e)
        }
    }
}

const {
    APIZ_INSTANCE
} = process.env

function MessageBuilderRegular(user_name, user_phone){
    return {
        phone: user_phone,
        message: "Olá "+user_name+", você criou uma conta na SemFila, "+
        "por isso estou te enviando esta mensagem. \n Obrigado por se cadastrar, "+
        "antes de continuar me adicione em seus contatos para receber qrcodes e links, "+
        "assim você usa todo o poder da SemFila."+"\n Todas as suas compras sempre serão enviadas "+
        "para este número ou pelo próprio site semfila.app \n Boas compras e fique longe da fila!"
    }
}
