//const limitModel= require("../../../models/limit.model")
const itemsModel= require("../../../models/items.model")

module.exports = {
    async limit_controller(id, qtd){ //Apenas métodos de pagamento.
        try{
            const item = await itemsModel.findById({_id: id})
            console.log(item.item_name)
            if(!item){
                return { status:false, find:false};
            }
            if(item.limit_switch){ //TEM LIMITADOR
                item.limit_number = item.limit_number - qtd; //TESTA
                console.log(item.limit_number)
                item.save();
                if(item.limit_number <0){ //FALHA.
                    return { status:false, find:true};
                }
                return {status:true} //>= 0
            }
            return {status:true}
        }catch(e){
            console.log("Erro no Limit_controller")
            console.log(e.message)
            return {status:false, msg:e.message}
        }
    }
}


