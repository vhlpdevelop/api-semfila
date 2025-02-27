
const { Schema, model } = require('mongoose');
const item = new Schema({
  item_name: { type: String},
  id_pag: {type:String, default: ''},
  description: { type:String},
  type: { type:String},
  image_url: {type:String},
  price: {type:String},
  status: {type:Boolean},
  ncm: {type:String, default: ''},
  icms: {type:String}, default: '',
  custo: {type:String, default: '0'},
  category_id: {type: String},
  company_id:{type:String, required: true},
  promotion: {type:Boolean},
  discount_status: {type:Boolean},
  discount_value: {type:String},
  limit_number: {type:Number, default: 0},
  limit_switch: {type:Boolean, default: false},
  promotion_duration: {type:String},
  trava: {type:Boolean, default:true},
  destaques: {type:Boolean},
  createdAt:{ type: Date, default: Date.now },
  
}, { collection : 'items' });

module.exports = model('Item', item);