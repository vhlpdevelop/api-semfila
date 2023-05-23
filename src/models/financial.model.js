
const { Schema, model } = require('mongoose');
const financial = new Schema({
        company_id: {type:String},
        contract_id: {type:String, default: "633f3735495e7e3f75b808ba"},
        stripe_id: {type:String},
        pagarme_id: {type:String},
        responsible: {type:Object},
        account_number: {type:String},
        bank:{type:String},
        agency: {type:String},
        draw_type: {type:String},
        last_draw: {type: Date, default:Date.now},
        next_draw: {type: Date, default:Date.now},
        account_type: {type:String},
        store_name: {type:String},
        cnpj: {type:String},
        draw: {type:Boolean},
        juridic: {type:String},
        createdAt:{ type: Date, default: Date.now }
});

module.exports = model('financial', financial);