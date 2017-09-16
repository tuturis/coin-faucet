require('dotenv').config()
const mongoose = require('mongoose');

const CronJob = require('cron').CronJob;
const ProxyLists = require('proxy-lists');

const Pf = require('./models/proxy_list');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  process.exit();
});

/*var job = new CronJob({
  cronTime: '0 * * * *',
  onTick: function() {

  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job.start();*/

var options = {
  filterMode: 'loose',
  sourcesBlackList : ['bitproxies', 'kingproxies']
};
var gettingProxies = ProxyLists.getProxies(options);

gettingProxies.on('data', function(proxies) {
  proxies.map((proxy) => {
    pf = new Pf()
    pf.ip = proxy.ipAddress
    pf.save().then(() => {
    console.log(`ip saved`);
  })
  .catch((err) => {
    // Handle rejections returned from increment()
    console.log(err);
  });
  })
});

gettingProxies.on('error', function(error) {
  // Some error has occurred.
  console.error(error);
});

gettingProxies.once('end', function() {
  // Done getting proxies.
});