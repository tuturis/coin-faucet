// const altcoin = require('node-altcoin')();
const toHTML = require('himalaya/translate').toHTML

// const PaymentQ = require('../models/paymentQ');
// const proxy_list = require('../models/proxy_list');
// const Ref = require('../models/ref');
// const Tx_logs = require('../models/tx_log');
const sConfig = require('../models/sConfig')

const config = require('../config')
// altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
// altcoin.set('host', process.env.rpchost)
// altcoin.set({port:process.env.rpcport})

exports.init = (req, res, next) => {
    sConfig.init((error, data) => {
        console.log(`error - ${error}, data - ${JSON.stringify(data)}`)
    })
}    