const { Schema, model } = require('mongoose');
const Admin = new Schema({
  user: { type: String, required:true},
  pss: { type: String, required: true, select: false },
  createdAt:{ type: Date, default: Date.now }
});

module.exports = model('Admin', Admin);