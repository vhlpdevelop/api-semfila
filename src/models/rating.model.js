
const { Schema, model } = require('mongoose');
const rating = new Schema({
  user_id: { type: String},
  store_id: { type:String},
  user_email: {type:String},
  ratings: {type:Number},
  message: {type:String, default: "Sem comentário"},
  menu_id: {type:String},
  createdAt:{ type: Date, default: Date.now }
});

module.exports = model('rating', rating);