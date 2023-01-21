
const { Schema, model } = require('mongoose');
const store = new Schema({
  name: { type: String},
  company_id: { type:String},
  store_url: { type: String},
  activate: {type:Boolean, default:true},
  store_img: {type:String}
}, { collection : 'store' });

module.exports = model('Store', store);