
const { Schema, model } = require('mongoose');
const company = new Schema({
  company_name: { type: String},
  cnpj: { type:String , required:true},
  contract: { type:String},
  type: {type:String},
  endereco: {type:String},
  status: {type:Boolean, default: false},
  createdAt:{ type: Date, default: Date.now }
}, {collection: 'company'});

module.exports = model('Company', company);