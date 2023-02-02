//const limitModel= require("../../../models/limit.model")
const itemsModel= require("../../../models/items.model")

module.exports = {
    async limit_controller(id){ //Apenas métodos de pagamento.
        try{
            const item = await itemsModel.findById({_id: id})
            if(!item){
                return { status:false, find:false};
            }
            if(item.limit_switch){ //TEM LIMITADOR
                item.limit_number = item.limit_number - 1; //TESTA
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


