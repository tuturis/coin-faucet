const altcoin = require('node-altcoin')();
const PaymentQ = require('../models/paymentQ');
const proxy_list = require('../models/proxy_list');
const config = require('../config')
altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpchost)
altcoin.set({port:process.env.rpcport})
/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
    altcoin.exec('getbalance', (err, balance) => {
        res.render('home', {
            title: 'Home',
            captcha: req.recaptcha,
            balance: balance,
            info : {
                coinName : config.coin.name,
                minClaim : config.payout.min,
                maxClaim : config.payout.max,
                interval : config.payout.interval,
            }
            
        })
    })
};
exports.post = (req, res) => {
    let pq = new PaymentQ()
    let claim = getRandomArbitrary(config.payout.min, config.payout.max).toFixed(8)
    pq.address = req.body.address;
    pq.ip = req.ip;
    pq.amount = claim;
    pq.save((err) => {
        if(err) {
            req.flash('error', {message : 'Internal error'})
            res.redirect('/');
        }
            req.flash('success', {message : `Your claim of ${claim} ${config.coin.name} is under way!`})
            res.redirect('/');      
    });
} 

exports.validateAdress = (req, res, next) => {
    altcoin.exec('validateaddress', req.body.address, (err, info) => {
        if(err) {
            console.log(`ERR ${JSON.stringify(err)}`);
            req.flash('error', {message : 'Internal error'})
            res.redirect('/')                
        }
        if(info.isvalid == true) {
            next();
        } else {
            req.flash('error', {message : `Invalid ${config.coin.name} address`})
            res.redirect('/')                   
        }
    })
}
exports.proxyFilter = (req, res, next) => {
    proxy_list.count({ip : req.ip}, (err, count) => {
        if(err) {
            console.log(`error ${err}`)
            req.flash('error', {message : `ERROR ${err}`})
            res.redirect('/');
        }
        if(count > 0) {
            req.flash('error', {message : 'Requests from TOR or Proxy services is not allowed due to abuse'})
            res.redirect('/');
        } else {
            next();
        }
    })
};
exports.captchaCheck = (req, res, next) => {
    if (!req.recaptcha.error) {
        next()
    } else {
        req.flash('error', {message : 'invalid reCaptcha, try again'})
        res.redirect('/')
    }
}
exports.checkClaimed = (req, res, next) => {
    let now = new Date();
    let interval = now.setHours(now.getHours() - config.payout.interval) 
    PaymentQ.find(
        {$and: [
            { $and:[{ip : req.ip}, {address : req.body.address}]},
            { createdAt: {$gt : interval}}
            ]}, 
        (err, pqs) => {
            console.log(pqs)
            if(err) {
                console.log(`ERROR ${err}`)
                req.flash('error', {message : 'Internal error'})
                res.redirect('/')       
            }
            if(pqs.length > 0) {
                req.flash('error', {message : `You can claim coins only every ${config.payout.interval} hours per same IP or ${config.coin.name} address`})
                res.redirect('/');
            } else {
                next()
            }
    })
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};