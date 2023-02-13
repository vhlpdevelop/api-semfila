
const { Schema, model } = require('mongoose');
const consumable = new Schema({
  name: { type: String},
  category: { type:String, required:true},
  subcategory: { type:String},
  url: {type:String},
  createdAt:{ type: Date, default: Date.now }
}, {collection: 'consumable'});

module.exports = model('consumable', consumable);