
const { Schema, model } = require('mongoose');
const qrcode = new Schema({
  item: {type:Object},
  user_id: {type:String},
  user_phone: {type:String},
  pedido_id: {type:String},
  company_id: { type:String},
  quantity: {type:String},
  optional_name: {type:String},
  trava: {type:Boolean, default:true},
  store_id: {type:String},
  withdraw: {type:Boolean, default:false},
  store_name: {type:String},
  QrImage: { type: String},
  devedor: {
    cpf: {type:String},
    nome: {type:String}
  },
  state: {type:Boolean, default:true},
  cortesia: {type:Boolean, default:false},
  createdAt:{ type: Date, default: Date.now }
},{collection: 'Qrcode'});
module.exports = model('Qrcode', qrcode);