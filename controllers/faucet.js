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
    console.log(`query from index ${req.query.ref}`)
    altcoin.exec('getbalance', (err, balance) => {
        /*console.log(` res.locals ${JSON.stringify(res.locals, null, "\t")}`)
        console.log(` req.addressStats ${JSON.stringify(req, null, "\t")}`)
        console.log(` req.addressStats ${JSON.stringify(req.addressStats, null, "\t")}`)*/
        res.render('home', {
            title: 'Home',
            captcha: req.recaptcha,
            balance: balance,
            addressBalance : req.addressBalance,
            referralAddress: req.query.ref,
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
            if(req.addressStats.referredBy != null) {
                let refPq = new PaymentQ()
                let refClaim = (claim * config.payout.referralCommision).toFixed(8)
                console.log(`referral claim ${refClaim}`)
                refPq.address = req.addressStats.referredBy
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
            req.addressStats.totalBalance = result[0].balance
            req.addressStats.address = req.body.address
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
        console.log(`unpaidBalance ${JSON.stringify(result)}`)
        if(result.length > 0) {
            req.addressStats.unpaid = result[0].balance
         } else {   
            req.addressStats.unpaid = result[0].balance
         }
        next()
    })   
}
exports.checkClaimed = (req, res, next) => {
    let now = new Date();
    let interval = now.setHours(now.getHours() - config.payout.interval) 
    let ip = req.headers['x-real-ip'];
    console.log(` req.addressStats in 'checkClaimed' ${JSON.stringify(req.addressStats, null, "\t")}`)
    req.flash('ainfo', req.addressStats)
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
    let referredBy = req.body.ref || undefined
    console.log(`referredBy ${JSON.stringify(referredBy)}`)
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
                    if(err) {console.log(`newRef.referredBy error ${err}`) }
                    console.log(`newRef.referredBy ${newRef.referredBy}`)
                    req.addressStats.referredBy = newRef.referredBy;    
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
                console.log(`ref.referredBy ${ref.referredBy}`)
                req.addressStats.referredBy = ref.referredBy;
                next()
            } else {
                console.log(`ref.referredBy null`)
                req.addressStats.referredBy = null
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
        req.addressStats.referralCount = count
        next()
    })
}
exports.refCommision = (req, res, next) => {
    console.log(`req.addressStats.referralCount ${req.addressStats.referralCount}`)
    if(req.addressStats.referralCount > 0) {
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
                req.addressStats.referralCommision = results[0].amount;
                console.log(`Referral commision - ${JSON.stringify(results)}`)
                next()
        })
    } else {
        req.addressStats.referralCommision = 0;
        next()
    }
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};