
const { Schema, model } = require('mongoose');
const limit = new Schema({
  item_id: { type: String},
  limit_number: { type:Number},
  status: {type:Boolean},
  createdAt: {type: Date, default: Date.now()}
}, {collection: 'limit'});

module.exports = model('limit', limit);