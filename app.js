require('dotenv').config()
var altcoin = require('node-altcoin')()

altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpcconnect)
altcoin.set({port:process.env.rpcport})
altcoin.getDifficulty(function() {
    console.log(arguments);
})