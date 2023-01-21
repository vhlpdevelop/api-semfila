
const { Schema, model } = require('mongoose');
const report = new Schema({
  idCardapio: {type:String},
  store_name: {type:String},
  message: {type:String},
  company_id: {type:String},
  user_id: {type:String},
  company_warn:  {type:Boolean, default:false},
  user_warn: {type:Boolean, default:false},
  user_email: {type:String},
  createdAt:{ type: Date, default: Date.now }
});
module.exports = model('Report', report);