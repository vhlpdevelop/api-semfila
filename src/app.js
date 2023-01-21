
const path = require('path') 
const gateway = require( 'express-gateway' );
require('./Auth Service/app');
require ('./Admin Service/app')
require ('./Front Service/app')
require ('./QrCode Service/app')
require ('./Crud Service/app')
require ('./Entrance Service/app')
gateway()
  .load(path.join(__dirname, 'config'))
  .run();