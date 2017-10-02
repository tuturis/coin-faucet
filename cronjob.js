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

let job = new CronJob({
  cronTime: '0 6,18 * * *',
  onTick: function() {
    getPf()
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job.start();

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

function getPf() {
  request('https://www.dan.me.uk/torlist/', function (error, response, body) {
    body.toString().split('\r\n').forEach((line) => {
      pf = new Pf()
      pf.ip = line
      pf.save()
      .then(() => {
      })
      .catch((err) => {
      });
    })
  });
  var options = {
    filterMode: 'loose',
    sourcesBlackList : ['kingproxies'],
    bitproxies : {apiKey: 'A0jDWJanQmLyeOKmXTPCQRBE6dLJrFY8'}
  };
  var gettingProxies = ProxyLists.getProxies(options);

  gettingProxies.on('data', function(proxies) {
    proxies.map((proxy) => {
      pf = new Pf()
      pf.ip = proxy.ipAddress
      pf.save().then(() => {
    })
    .catch((err) => {
      
      });
    })
  });

  gettingProxies.on('error', function(error) {
    console.error(error);
  });

  gettingProxies.once('end', function() {
    
  });
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
          }
        })
      })            
    }
  })
}