
const { Schema, model } = require('mongoose');
const contract = new Schema({
  tax: {type:String, default:"5"},
  tax_credit: {type:String, default: "6"},
  days: {type:String, default:"7"},
  tax_week: {type:String, default:"1"},
  contract_info:{type:String,select: false},
  createdAt:{ type: Date, default: Date.now }
}, {collection: 'contracts'});

module.exports = model('Contract', contract);