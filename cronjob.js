require('dotenv').config()
const mongoose = require('mongoose');
const altcoin = require('node-altcoin')({
      passphrasecallback: function(command, args, callback) {
        console.log(` pass = ${process.env.WALLET_PASSPHRASE}`)
        callback(null, process.env.WALLET_PASSPHRASE, 120);
    }
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
altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpchost)
altcoin.set({port:process.env.rpcport})
/*
var job = new CronJob({
  cronTime: '0 * * * *',
  onTick: function() {
    getPf()
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job.start();
var job2 = new CronJob({
  cronTime: '15,45 * * * *',
  onTick: function() {
    payToPq()
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job2.start();
*/
function payToPq() {
   let add 
/*    altcoin.exec('getnewaddress', "faucet" , (err, address) => {
      if(err) {
        console.log(err)
      }
      add = address
      console.log(address)
    })*/

    altcoin.exec('getaccount', "DmkLHSA2nPrznFRhoyQ2hZEVwstK4kxtNz", (err, account) => {
      if(err) {
        console.log(`error getaccount - ${err}`)
      }
      console.log(`account - ${account}`)
    })
    PQ.find({'claimed': false}, (err, results) => {
      if(err) {
        console.log(err)
        /*process.exit()*/
      }
      console.log(results)
/*      let pqa = [];
      results.map((result) => {
        pqa.push({address : result.address, amount : result.amount})   
      })
      let sendparams = [];
      sendparams.push("{");
      for(i=0; i<results.length(); i++) {
        if(results.length() - 1 == 0) {
          sendparams.push(`\"${pqa[i].address}\":${pqa[i].amount}`)  
        } else {
          sendparams.push(`\"${pqa[i].address}\":${pqa[i].amount},`)  
        }
      }
      sendparams.push("}");
      sp = sendparams.join("");
      console.log(sp)
      //altcoin.exec('sendmany',  ["mine", "{\"DZ1kbscnDzqoJnnh2KLtrx4MkYcNNiPuBe\":0.01,\"DonioN7gV9qjCZWfdKxGXDYdrhLoZMDVV5\":0.01}", 1, "Ilgas komentaras"], (err, cb) => {
      altcoin.exec('sendmany',  ["faucet", sp, 1, "Ilgas komentaras"], (err, cb) => {
        if(err) {
          console.log(`err sendmany - ${err}`)
        }
        console.log(cb)
        
      })*/
    }) 
    .setOptions({ multi: true })
    .update({$set: {'claimed': false}});   
}
payToPq()
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
    // Some error has occurred.
    console.error(error);
  });

  gettingProxies.once('end', function() {
    
  });
}