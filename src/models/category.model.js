
const bcrypt = require('bcrypt');

const { Schema, model } = require('mongoose');
const category = new Schema({
  category_name: { type: String, required:true},
  status: { type:Boolean},
  type: { type:String},
  createdAt:{ type: Date, default: Date.now }
},{collection: 'category'});

module.exports = model('category', category);