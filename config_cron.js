require('dotenv').config()
const mongoose = require('mongoose');
const captcha = require('./express-coinhive-captcha')
const CronJob = require('cron').CronJob;
const sConfig = require('./models/sConfig')
const CMC = require('node-coinmarketcap')


mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
    console.error(err);
    process.exit();
});

captcha.init(process.env.COINHIVE_SITE_KEY, process.env.COINHIVE_SECRET_KEY,
    {
        whitelabel: false,
        hashes: 5120,
        shortenHashes: 256,
        disableElements: 'button[type=submit]'
    }
);
let config = {}
sConfig.find({})
    .sort({ 'createdAt': -1 })
    .limit(1)
    .exec((err, c) => {
        if (err) { console.error(err) }
        let config = c[0].siteConfig
        var options = {
            convert: "USD" // Convert price to different currencies. (Default USD)
        }
        var coinmarketcap = new CMC(options);

        coinmarketcap.get(config.coin.name.toLowerCase(), (coin) => {
            console.log(`coin - ${coin}`)
            let tickerUsdPrice = coin.price_usd
            let captchaHashes = config.site.captchaHashes
            captcha.middleware.payout((error, d) => {
                if (error) {
                    console.error(error)
                }
                let data = d.result
                let payoutPerCaptchaHashesXMR = (parseFloat(data.payoutPer1MHashes) / (1000000 / captchaHashes)).toFixed(16)
                let payoutPerCaptchaHashesUSD = (payoutPerCaptchaHashesXMR * data.xmrToUsd).toFixed(16)
                let claim = (payoutPerCaptchaHashesUSD / tickerUsdPrice * config.payout.profit).toFixed(config.coin.decimals)
                sC = new sConfig()
                sC.siteConfig = c[0].siteConfig
                sC.siteConfig.payout.claim = claim
                sC.save(() => {
                    console.log(`saved new config`)
                })
            })
        })
    })