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

PQ.aggregate([
  { '$match' :
    {'claimed': false
      'address': 'DYNBASTgKsmsSkeosmJqREHoq7NtfJpesF' 
    }
  }, 
  { '$group': {
      '_id': "$address",
      'amount': {'$sum': '$amount'},
      'count': {'$sum': 1}, 
      'ids' : {'$push' : {'id' :'$_id'}}
    }
  }],
  (err, results) => {
    if(err) {
      console.log(err)
    }
    if(results.length > 0) {
      let pqa = {};
      let idsToUpdate = [];
      console.log(`config.payout.treshold ${config.payout.treshold}`)
      console.log(`result.amount ${result.amount}`)
      results.map((result) => {
        if (result.amount >= config.payout.treshold) {
          pqa[result._id] = result.amount
          result.ids.map((id) => {
            idsToUpdate.push(id.id)
          })
        }
      })
      PQ.find({'_id': { $in: idsToUpdate }}, (err, ids) => {
        if(err) {console.log(`${err} when updating`)};
        let addressCount = results.length
        console.log(`addressCount ${addressCount}`)
        console.log(`sendMany( ${JSON.stringify(pqa, null, '\t')}`)
      })
/*      .setOptions({ multi: true })
      .update({$set: {'claimed': true}}, (err, success) => {
        if(err) {console.log(err)};
        console.log(`update ${JSON.stringify(success)}`)
      });*/
    }
  }
) 


function sendMany(pqa) {
  client.getBalance((err,balance) => {
    if(balance > 0) {
      client.walletPassphrase(process.env.WALLET_PASSPHRASE, 120, (err, cb) => {
        if(err) {
          console.log(`err unlock - ${err}`)
        }
        client.sendMany('faucet', pqa, 1, `Reward from ${config.site.name}`, (err, cb) => {
          if(err) {
            console.log(`err sendmany - ${err}`)
          }
        })
      })            
    }
  })
}