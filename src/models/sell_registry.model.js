
const { Schema, model } = require('mongoose');
const sellRegistry = new Schema({
        user_id: {type:String, required:true},
        pedido_id: {type:String, required:true},
        user_email: {type:String},
        user_name: {type: String},
        company_id: {type:String, required:true},
        store_id: {type:String, required: true},
        qrcode_id: {type:String, required:true},
        payment: {type:String},
        item: {type:Object},
        cortesia: {type: Boolean,default:false},
        total: {type: String},
        quantity: {type:String},
        draw: {type:Boolean,default:false},
        refund: {type:Boolean, default:false},
        createdAt:{ type: Date, default: Date.now }
});

module.exports = model('sellRegistry', sellRegistry);