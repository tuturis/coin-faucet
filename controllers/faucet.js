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
            addressBalance : req.addressBalance,
            info : {
                coinName : config.coin.name,
                minClaim : config.payout.min,
                maxClaim : config.payout.max,
                interval : config.payout.interval,
                address  : config.coin.address,
                coinInfo : config.coin.info,
                aads     : config.ads.aads,
                coinurl  : config.ads.coinurl,
                ganalytics : config.analytics.google
            }
        })
    })
};
exports.post = (req, res) => {
    let pq = new PaymentQ()
    let claim = getRandomArbitrary(config.payout.min, config.payout.max).toFixed(8)
    let ip = req.headers['x-real-ip'];

    if(ip) {
        pq.address = req.body.address;
        pq.ip = ip;
        pq.amount = claim;
        pq.save((err) => {
            if(err) {
                req.flash('error', {message : 'Internal error'})
                res.redirect('/');
            }
                req.flash('success', {message : `Your claim of ${claim} ${config.coin.name} is under way!`})
                res.redirect('/');      
        });
    } else {
        req.flash('error', {message : 'Something went wrong...'})
        res.redirect('/');
    }
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
    let ip = req.headers['x-real-ip'];
    proxy_list.count({ip : ip}, (err, count) => {
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
exports.addressBalance = (req, res, next) => {
    PaymentQ.aggregate([
    { '$match' : {
        'address' : req.body.address
        }
    },
    { '$group': {
        '_id'    : null,  
        'balance': { '$sum': '$amount' },
        'count' : {'$sum': 1}
        }
    }],
    (err, result) => {
        if(result.length > 0) {
            req.flash('ainfo', `Your address (${req.body.address}) claimed total of ${result[0].balance}, ${result[0].count} times`)
        }
        next()
    })
}
exports.unpaidBalance = (req, res, next) => {
 PaymentQ.aggregate([
    { '$match' : {
        'address' : req.body.address,
        'claimed' : false
        }
    },
    { '$group': {
        '_id'    : null,  
        'balance': { '$sum': '$amount' },
        }
    }],
    (err, result) => {
        if(result.length > 0) {
            req.flash('ainfo', `Unpaid balance is ${result[0].balance}`)
         }
        next()
    })   
}
exports.checkClaimed = (req, res, next) => {
    let now = new Date();
    let interval = now.setHours(now.getHours() - config.payout.interval) 
    let ip = req.headers['x-real-ip'];

    PaymentQ.find(
        {$and: [
            { $or:[{ip : ip}, {address : req.body.address}]},
            { createdAt: {$gt : interval}}
            ]}, 
        (err, pqs) => {
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