const mongoose = require('mongoose');

const URI = 'mongodb+srv://vhlpdevelp:twater22@smartline-bd-0.rkwpqow.mongodb.net/?retryWrites=true&w=majority';
//const URI = 'mongodb://localhost/apiextensaoLADS';

mongoose.connect(URI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});
const db = mongoose.connection;
mongoose.Promise = global.Promise
module.exports = db;