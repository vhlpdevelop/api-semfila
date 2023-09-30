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
                await axios.post(APIZ_INSTANCE+'/send-text', {phone:pedido.user_phone,message:randomTextTicket()})
                await axios.post(APIZ_INSTANCE+'/send-text', {phone:pedido.user_phone,message:"https://www.semfila.app/resgate/"+url_button})
            }else{
                await axios.post(APIZ_INSTANCE+'/send-link', {
                    phone: pedido.user_phone,
                    message: randomText(url_button),
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

function randomTextTicket(){
    var text = [
        "Para concluir a reserva do(s) seu(s) ingresso(s), clique no link a seguir. Os códigos QR serão enviados para este mesmo número.",
        "A fim de concluir a compra do(s) seu(s) ingresso(s), clique no link abaixo. Os códigos QR serão enviados para este mesmo número.",
        "Para garantir o acesso ao evento com o(s) seu(s) ingresso(s), acesse o link abaixo. Os códigos QR serão enviados para este mesmo número.",
        "Para completar a reserva do(s) seu(s) ingresso(s), clique no link a seguir. Os códigos QR serão enviados para este mesmo número.",
        "Para assegurar sua entrada no evento com os seus ingressos, por favor, acesse o link abaixo. Os códigos QR serão enviados para este mesmo número.",
        "Não se esqueça de acessar o link abaixo para obter seus ingressos e QR Codes para o evento. Eles serão enviados para este mesmo número.",
        "Para a entrada no evento com os seus ingressos, basta seguir o link abaixo. Os códigos QR serão disponibilizados neste número.",
        "Para receber os seus ingressos e os códigos QR para o evento, acesse o link a seguir. Eles serão enviados para este número."
    ]
    return text[Math.floor(Math.random() * text.length)]
}

function randomText(id){
    var text = [
        "Sinta-se à vontade para visualizar sua compra em nosso cardápio agora mesmo. Clique no link a seguir: https://www.semfila.app/resgate/"+id,
        "Quer dar uma olhada no seu pedido? Basta clicar no link abaixo para acessar o nosso cardápio: https://www.semfila.app/resgate/"+id,
        "Seu pedido está pronto para ser conferido em nosso cardápio. Não perca tempo, clique no link: https://www.semfila.app/resgate/"+id,
        "Curioso para ver o que você pediu? Acesse nosso cardápio com apenas um clique no link: https://www.semfila.app/resgate/"+id,
        "Está com sede de curiosidade? Confira seu pedido em nosso cardápio agora mesmo. Link: https://www.semfila.app/resgate/"+id,
        "Confira o seu pedido no nosso menu agora mesmo. Basta acessar o link a seguir: https://www.semfila.app/resgate/"+id,
        "Sua compra está pronta para ser visualizada em nosso cardápio. Clique no link abaixo para conferir: https://www.semfila.app/resgate/"+id,
        "Deseja ver sua compra no nosso cardápio? É fácil! Basta clicar no link: https://www.semfila.app/resgate/"+id,


    ]
    return text[Math.floor(Math.random() * text.length)]
}