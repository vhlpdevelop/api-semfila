
const { Schema, model } = require('mongoose');
const menu_category = new Schema({
  menu_id: { type: String},
  category_id: { type:String},
}, {collection: 'menu_category'});

module.exports = model('Menu_category', menu_category);