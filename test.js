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
const Ref = require('./models/ref');
const Tx_logs = require('./models/tx_log');

const _ = require('underscore');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  process.exit();
});

/*Ref.aggregate([
  {'$match': 
    {
      'ref': true,
      'address': "LgQxUzvGLu6Rj4VmH8kXTmhz3BVEoNKi8g"
    }
  },
  { '$group' : 
    {
      '_id': "$address",
      'amount': {'$sum': '$amount'},
    }
  }],
  (err, results) => {
    if(err) {
      console.log(`ERR ${JSON.stringify(err)}`);
    }
    console.log(`refCommision aggregate ${JSON.stringify(results,null,'\t')}`)
  }
)*/
/*let r = new Ref()
r.address = "123"
r.referredBy = "321"
r.save((err) => {
    if (err) (console.log(`ERROR ${err}`))
    console.log(`saved`)
})*/
Tx_logs.find({})
    .select('address amount tx')
    .sort({'createdAt': -1})
    .limit(10)
    .exec(function(err, txs) {
        if(err) {
            console.log(`error ${err}`)
            req.flash('error', `ERROR ${err}`)
            res.redirect('/');
        }
        if(txs.length = 0) {
        } else {
            console.log(`txs ${txs}`)
        }
    });

/*PQ.aggregate([
  { '$match' :
    {'claimed': false
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
      console.log(`results ${JSON.stringify(results, null, '\t')}`)
      console.log(`typepf results ${typeof results}`)
      results.map((result) => {
        if (result.amount >= config.payout.treshold) {
          pqa[result._id] = result.amount
          result.ids.map((id) => {
            idsToUpdate.push(id.id)ex
          })
        }
      })
      console.log(`pqa ${JSON.stringify(pqa, null, '\t')}`)
      
      PQ.find({'_id': { $in: idsToUpdate }}, (err, ids) => {
        if(err) {console.log(`${err} when updating`)};
        let addressCount = results.length
        console.log(`addressCount ${addressCount}`)
        console.log(`sendMany( ${JSON.stringify(pqa, null, '\t')}`)
      })
    }
  }
) */

/*
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
}*/