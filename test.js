require('dotenv').config()
const mongoose = require('mongoose');
/*const altcoin = require('node-altcoin')({
      passphrasecallback: function(command, args, callback) {
        console.log(` pass = ${process.env.WALLET_PASSPHRASE}`)
        callback(null, process.env.WALLET_PASSPHRASE, 120);
    }
});
*/
const config = require('./config')

const Client = require('bitcoin-core');
const client = new Client({
  username: process.env.rpcuser,
  password: process.env.rpcpassword,
  port: process.env.rpcport,
  host: process.env.rpchost
});

const CronJob = require('cron').CronJob;
const ProxyLists = require('proxy-lists');
const request = require('request');
const Pf = require('./models/proxy_list');
const PQ = require('./models/paymentQ');
const _ = require('underscore');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  process.exit();
});

PQ.aggregate(/*{
  '$match' :
    {'claimed': false}
  },*/ {
  '$group': {
    '_id': {'$address'},
    'amount': 
      {'$sum': 
        {'$cond' : [ 
          { "$eq": [ "$claimed", true ] }, "$amount", 0 
          ]}
      }
/*      {'$gte' : [ 
        {'$sum': '$amount'}, config.payout.threshold
      ]}*/
    },

  }
  (err, results) => {
  if(err) {
    console.log(err)
  }
  if(results.length > 0) {
    let pqa = {};
    results.map((result) => {
        pqa[result.address] = result.amount  
    })
    console.log(`aggregate results - ${results}`)
    console.log(`payment q aggregate - ${pqa}`)
  }
}) 
.setOptions({ multi: true })
.update({$set: {'claimed': true}}, (err, success) => {
  if(err) {console.log(err)};
  console.log(`up ${success}`)
}); 