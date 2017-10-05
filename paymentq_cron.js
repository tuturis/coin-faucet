require('dotenv').config()
const mongoose = require('mongoose');
const CronJob = require('cron').CronJob;
const Client = require('bitcoin-core');
const _ = require('underscore');

const client = new Client({
  username: process.env.rpcuser,
  password: process.env.rpcpassword,
  port: process.env.rpcport,
  host: process.env.rpchost
});

const config = require('./config')
const PQ = require('./models/paymentQ');
const tx_log = require('./models/tx_log');


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  process.exit();
});

let job2 = new CronJob({
  cronTime: '15,45 * * * *',
  onTick: function() {
    payToPq()
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job2.start();

function payToPq() {
  PQ.aggregate([
    { '$match' :
      {'claimed': false}
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
      if(results && results.length > 0) {
        let pqa = {};
        let idsToUpdate = [];
        results.map((result) => {
          if (result.amount >= config.payout.treshold) {
            pqa[result._id] = result.amount
            result.ids.map((id) => {
              idsToUpdate.push(id.id)
            })
          }
        })
        if(Object.keys(pqa).length > 0) {
          PQ.find({'_id': { $in: idsToUpdate }}, (err, ids) => {
            if(err) {console.log(`${err} when updating`)};
            let addressCount = Object.keys(pqa).length
            console.log(`addressCount ${addressCount}`)
            console.log(`sendMany( ${JSON.stringify(pqa, null, '\t')}`)
            sendMany(pqa)
          })
          .setOptions({ multi: true })
          .update({$set: {'claimed': true}}, (err, success) => {
            if(err) {console.log(err)};
            console.log(`update ${JSON.stringify(success)}`)
          });
        }
      }
    }
  ) 
}


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
            return false;
          }
          _.each(pqa, function(value, key, obj) {
              let tx = new tx_log();
              tx.address = obj[key]
              tx.amount = value
              tx.tx = cb
              tx.save((err) => {
                if(err) {
                  console.log(`err saving tx - ${err}`)
                  return false;
                }
              })
          });
          console.log(`send many callback ${JSON.stringify(cb)}`)
        })
      })            
    }
  })
}