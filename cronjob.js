require('dotenv').config()
const mongoose = require('mongoose');
/*const altcoin = require('node-altcoin')({
      passphrasecallback: function(command, args, callback) {
        console.log(` pass = ${process.env.WALLET_PASSPHRASE}`)
        callback(null, process.env.WALLET_PASSPHRASE, 120);
    }
});
*/
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
  cronTime: '0 * * * *',
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
    PQ.find({'claimed': false}, (err, results) => {
      if(err) {
        console.log(err)
        /*process.exit()*/
      }
      if(results.length > 0) {
        let pqa = {};
        results.map((result) => {
          pqa[result.address] = result.amount  
        })

        client.walletPassphrase(process.env.WALLET_PASSPHRASE, 120, (err, cb) => {
          if(err) {
              console.log(`err unlock - ${err}`)
            }
          /*altcoin.exec('sendmany',  ["faucet", sp, 1, "Ilgas komentaras"], (err, cb) => {*/
          client.sendMany('faucet', pqa, 1, `Reward from ${config.site.name}`, (err, cb) => {
            if(err) {
              console.log(`err sendmany - ${err}`)
            }
            console.log(`paid to   ${results.length}`)
          })
        })
      }
    }) 
    .setOptions({ multi: true })
    .update({$set: {'claimed': true}});   
}


function getPf() {
  request('https://www.dan.me.uk/torlist/', function (error, response, body) {
    body.toString().split('\r\n').forEach((line) => {
      console.log(line)
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