const mongoose = require('mongoose');

const URI = '';
//const URI = 'mongodb://localhost/apiextensaoLADS';

mongoose.connect(URI, {
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});
const db = mongoose.connection;
mongoose.Promise = global.Promise
module.exports = db;
