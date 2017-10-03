const altcoin = require('node-altcoin')();
const PaymentQ = require('../models/paymentQ');
const proxy_list = require('../models/proxy_list');
const Ref = require('../models/ref');
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
                treshold : config.payout.treshold,
                interval : config.payout.interval,
                address  : config.coin.address,
                coinInfo : config.coin.info,
                aads     : config.ads.aads,
                coinurl  : config.ads.coinurl,
                ganalytics : config.analytics.google 
            },
            exchanges: config.exchanges 
        })
    })
};
exports.post = (req, res) => {
    let claim = getRandomArbitrary(config.payout.min, config.payout.max).toFixed(8)
    let ip = req.headers['x-real-ip'];
    if(ip) {
        let pq = new PaymentQ()
        pq.address = req.body.address;
        pq.ip = ip;
        pq.amount = claim;
        pq.save((err) => {
            if(err) {
                req.flash('error', 'Internal error')
                res.redirect('/');
            }
            if(res.locals.referredBy != null) {
                let refPq = new PaymentQ()
                let refClaim = (claim * config.payout.referralCommision).toFixed(8)
                console.log(`referral claim ${refCliam}`)
                refPq.address = res.locals.referredBy
                refPq.ref = true
                refPq.amount = refClaim 
                refPq.save((err) => {
                    req.flash('success',`Your claim of ${claim} ${config.coin.name} is under way!`)
                    res.redirect('/');                          
                })
            } else {
                req.flash('success',`Your claim of ${claim} ${config.coin.name} is under way!`)
                res.redirect('/');      
            }
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
            req.flash('error', 'Internal error')
            res.redirect('/')                
        }
        if(info.isvalid == true) {
            next();
        } else {
            req.flash('error', `Invalid ${config.coin.name} address`)
            res.redirect('/')                   
        }
    })
}
exports.proxyFilter = (req, res, next) => {
    let ip = req.headers['x-real-ip'];
    proxy_list.count({ip : ip}, (err, count) => {
        if(err) {
            console.log(`error ${err}`)
            req.flash('error', `ERROR ${err}`)
            res.redirect('/');
        }
        if(count > 0) {
            req.flash('error','Requests from TOR or Proxy services is not allowed due to abuse')
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
        req.flash('error', 'invalid reCaptcha, try again')
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
            req.flash('ainfo', {address : req.body.address,
                                totalBalance: result[0].balance})
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
            req.flash('ainfo', {unpaid: result.balance})
         } else {   
            req.flash('ainfo', {unpaid: 0})
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
                req.flash('error', 'Internal error')
                res.redirect('/')       
            }
            if(pqs.length > 0) {
                req.flash('error', `You can claim coins only every ${config.payout.interval} hours per same IP or ${config.coin.name} address`)
                res.redirect('/');
            } else {
                next()
            }
    })
}
exports.checkReferrals = (req, res, next) => {
    let referredBy = req.query.ref
    if(referredBy !== undefined) {
        altcoin.exec('validateaddress', referredBy, (err, info) => {
            if(err) {
                console.log(`ERR ${JSON.stringify(err)}`);
            }
            if(info.isvalid == true) {
                let newRef = new Ref();
                newRef.address = req.body.address;
                newRef.referredBy = referredBy
                newRef.save((err) => {
                    res.locals.referredBy = newRef.referredBy;    
                    next();
                })
            } else {
                req.flash('error', `Invalid ${config.coin.name} address of referral`)
                next();                   
            }
        })
    } else {
        Ref.findOne({'address' : req.body.address}, (err, ref) => {
            if(err) {
                console.log(`ERR ${JSON.stringify(err)}`);
            }
            if(ref !== null) {
                req.flash('ainfo', {referredBy: ref.referredBy})
                res.locals.referredBy = ref.referredBy;
                next()
            } else {
                res.locals.referredBy = null
                next()
            }
        })
    }
}
exports.refCount = (req, res, next) => {
    Ref.count({'referredBy' : req.body.address}, (err, count) => {
        if(err) {
            console.log(`ERR ${JSON.stringify(err)}`);
        }
        res.locals.referralCount = count
        next()
    })
}
exports.refCommision = (req, res, next) => {
    if(res.locals.referralCount > 0) {
        Ref.aggregate([
            {'$match': 
                {
                    'ref':true,
                    'address': req.body.address
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
                //res.locals.referralCommision = results[0].amount;
                console.log(`Referral commision - ${JSON.stringify(results)}`)
                next()
        })
    } else {
        res.locals.referralCommision = 0;
        next()
    }
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};