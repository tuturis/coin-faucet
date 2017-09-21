require('dotenv').config()
const mongoose = require('mongoose');

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
  var bulk = PQ.collection.initializeOrderedBulkOp();
      bulk.find({'claimed': false}, (err, results) => {
        if(err) {
          console.log(err)
          process.exit()
        }
        console.log(results)
      }).update({$set: {'claimed': false}});
      bulk.execute(function (error) {
           callback();                   
      });
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