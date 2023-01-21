
const { Schema, model } = require('mongoose');
const sellRegistry = new Schema({
        user_id: {type:String, required:true},
        user_name: {type: String},
        company_id: {type:String, required:true},
        store_id: {type:String, required: true},
        qrcode_id: {type:String, required:true},
        item: {type:Object},
        cortesia: {type: Boolean,default:false},
        total: {type: String},
        devedor: { //Novo
                cpf: {type:String},
                nome: {type:String}
        },
        quantity: {type:String},
        draw: {type:Boolean,default:false},
        createdAt:{ type: Date, default: Date.now }
});

module.exports = model('sellRegistry', sellRegistry);