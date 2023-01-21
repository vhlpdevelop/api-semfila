
const { Schema, model } = require('mongoose');
const User_store = new Schema({
  user_id: { type: String},
  company_id: { type:String},
  type: { type:String},
}, { collection : 'user_store' });

module.exports = model('User_store', User_store);