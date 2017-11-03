require('dotenv').config()
const mongoose = require('mongoose');
const captcha = require('./express-coinhive-captcha')
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
const Ref = require('./models/ref');
const Tx_logs = require('./models/tx_log');
const sConfig = require('./models/sConfig')
const _ = require('underscore');
const CMC = require('node-coinmarketcap')


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  process.exit();
});

captcha.init(process.env.COINHIVE_SITE_KEY, process.env.COINHIVE_SECRET_KEY,
	{
		whitelabel:false,
		hashes: 5120, 
		shortenHashes: 256,
		disableElements: 'button[type=submit]'
	}
);
let config = {}
sConfig.find({})
  .sort({ 'createdAt' : -1 })
  .limit(1)
  .exec((err, c) => {
    if(err) {console.error(err)}
    let config = c[0].siteConfig
    var options = {
      events: true,
      refresh: 60, // Refresh time in seconds (Default: 60)
      convert: "USD" // Convert price to different currencies. (Default USD)
    }
    var coinmarketcap = new CMC(options); 
    
    coinmarketcap.on(config.coin.ticker, (coin) => {
      let tickerUsdPrice = coin.price_usd
      let captchaHashes = config.site.captchaHashes
      console.log(`tickerUsdPrice ${JSON.stringify(tickerUsdPrice)}`)
      console.log(`captchaHashes ${JSON.stringify(captchaHashes)}`)
      captcha.middleware.payout((error, d) => {
        let data = d.result
        console.log(JSON.stringify(data))
        let payoutPerCaptchaHashesXMR = (parseFloat(data.payoutPer1MHashes) / ( 1000000 / captchaHashes)).toFixed(16)
        console.log('payoutPerCaptchaHashesXMR - ' +  JSON.stringify(payoutPerCaptchaHashesXMR))
        let payoutPerCaptchaHashesUSD = (payoutPerCaptchaHashesXMR * data.xmrToUsd).toFixed(16)
        let maxClaim = (tickerUsdPrice * payoutPerCaptchaHashesUSD * config.payout.profit).toFixed(config.coin.decimals)
        console.log('payoutPerCaptchaHashesUSD - ' +  JSON.stringify(payoutPerCaptchaHashesUSD))
        console.log('maxClaim - ' +  JSON.stringify(maxClaim))
      })
    })
  })


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
/*Tx_logs.find({}, (err, txs) => {
        if(err) {
            console.log(`error ${err}`)
        }
        if(txs.length > 0) {
            console.log(`typoof txs ${typeof txs}`)
        } else {
            console.log(`typoof txs ${typeof txs}`)
            console.log(`txs ${JSON.stringify(txs)}`)
        }
    });*/

// PQ.aggregate([
//   { '$match' :
//     {'claimed': false
//     }
//   }, 
//   { '$group': {
//       '_id': "$address",
//       'amount': {'$sum': '$amount'},
//       'count': {'$sum': 1}, 
//       'ids' : {'$push' : {'id' :'$_id'}}
//     }
//   }],
//   (err, results) => {
//     if(err) {
//       console.log(err)
//     }
//     if(results.length > 0) {
//       let pqa = {};
//       let idsToUpdate = [];
//       console.log(`results ${JSON.stringify(results, null, '\t')}`)
//       console.log(`typepf results ${typeof results}`)
//       results.map((result) => {
//         if (result.amount >= config.payout.treshold) {
//           pqa[result._id] = result.amount
//           result.ids.map((id) => {
//             idsToUpdate.push(id.id)
//           })
//         }
//       })
//       console.log(`pqa ${JSON.stringify(pqa, null, '\t')}`)
      
//       PQ.find({'_id': { $in: idsToUpdate }}, (err, ids) => {
//         if(err) {console.log(`${err} when updating`)};
//         let addressCount = results.length
//         console.log(`addressCount ${addressCount}`)
//         console.log(`sendMany( ${JSON.stringify(pqa, null, '\t')}`)
//       })
//     }
//   }
// ) 

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