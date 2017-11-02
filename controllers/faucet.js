const altcoin = require('node-altcoin')();
const toHTML = require('himalaya/translate').toHTML

const PaymentQ = require('../models/paymentQ');
const proxy_list = require('../models/proxy_list');
const Ref = require('../models/ref');
const Tx_logs = require('../models/tx_log');

const config = require('../config')
altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpchost)
altcoin.set({port:process.env.rpcport})
/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
    let top   = config.ads.top !== ""  ? toHTML(config.ads.top)    : undefined 
    let top2  = config.ads.top2 !== "" ? toHTML(config.ads.top2)  : undefined
    let right = config.ads.right !== ""? toHTML(config.ads.right) : undefined
    let left  = config.ads.left !== ""  ? toHTML(config.ads.left)  : undefined

    res.render('home', {
        title: `${config.coin.name} Faucet`,
        captcha: req.captcha,
        balance: req.faucetBalance,
        addressBalance : req.addressBalance,
        recentTxs : req.addressStats.recentTx,
        info : {
            blockexpl : config.site.explorer,
            coinTicker: config.coin.ticker,
            coinName : config.coin.name,
            minClaim : (config.payout.min).toFixed(config.coin.decimals),
            maxClaim : (config.payout.max).toFixed(config.coin.decimals),
            referralCommision : (config.payout.referralCommision * 100).toFixed(2),
            treshold : config.payout.treshold,
            interval : config.payout.interval,
            address  : config.coin.address,
            coinInfo : config.coin.info,
            aads     : config.ads.aads,
            coinurl  : config.ads.coinurl,
            ganalytics : config.analytics.google,
            siteName : config.site.name 
        },
        ads: {
            top: top,  
            top2: top2,
            right: right,
            left: left,
        },
        exchanges: config.exchanges 
    })
};
exports.getFaucetBalance = (req, res, next) => { 
    altcoin.exec('getbalance', (err, balance) => { 
        if(err) {
            console.error(`${err}`)
            res.redirect('/');
        }
        req.faucetBalance = balance;
        next();
    })
};
exports.post = (req, res) => {
    req.flash('ainfo', req.addressStats)
    res.redirect('/');
} 
exports.claim = (req, res, next) => {
    let claim = getRandomArbitrary(config.payout.min, config.payout.max).toFixed(config.coin.decimals)
    let ip = req.headers['x-real-ip'];
    if(ip) {
        if(!req.claimed){
            let pq = new PaymentQ()
            pq.address = req.body.address;
            pq.ip = ip;
            pq.amount = claim;
            pq.save((err) => {
                if(err) {
                    req.flash('error', 'Internal error')
                    res.redirect('/');
                }
                if(req.addressStats.referredBy != undefined) {
                    let refPq = new PaymentQ()
                    let refClaim = (claim * config.payout.referralCommision).toFixed(config.coin.decimals)
                    refPq.address = req.addressStats.referredBy
                    refPq.ref = true
                    refPq.amount = refClaim 
                    refPq.save((err) => {
                        req.flash('success',`Your claim of ${claim} ${config.coin.name} is under way!`)
                        next()
                    })
                } else {
                    req.flash('success',`Your claim of ${claim} ${config.coin.name} is under way!`)
                    next()
                }
            });
        } else {
            req.flash('error', `You can claim coins only every ${config.payout.interval} hours per same IP or ${config.coin.name} address`)
            next()
        }
    } else {
        req.flash('error', {message : 'Something went wrong...'})
        res.redirect('/');
    }  
}
exports.getTxLogs = (req, res, next) => {
    Tx_logs.find({})
    .select('address amount tx')
    .sort({'createdAt': -1})
    .limit(10)
    .exec(function(err, txs) {
        if(err) {
            console.log(`error ${err}`)
            req.flash('error', `ERROR ${err}`)
            res.redirect('/');
        }
        if(txs.length > 0) {
            req.addressStats.recentTx = txs
            next();
        } else {
            req.addressStats.recentTx = []
            next();
        }
    });
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
            console.log('proxy filter hit')
            req.flash('error','Requests from TOR or Proxy services is not allowed due to abuse')
            res.redirect('/');
        } else {
            next();
        }
    })
};
exports.captchaCheck = (req, res, next) => {
    if (!req.captcha.error) {
        next()
    } else {
        req.flash('error', 'invalid captcha, try again')
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
            req.addressStats.totalBalance = (result[0].balance.toFixed(config.coin.decimals))
            req.addressStats.address = req.body.address
        } else {
            req.addressStats.totalBalance = 0
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
        if(result.length > 0) {
            req.addressStats.unpaid = (result[0].balance).toFixed(8)
         } else {   
            req.addressStats.unpaid = 0
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
            { createdAt: {$gt : interval}},
            { ref: false}]}, 
        (err, pqs) => {
            if(err) {
                console.log(`ERROR ${err}`)
                req.flash('error', 'Internal error')
                res.redirect('/')       
            }
            if(pqs.length > 0) {
                req.claimed = true
                next()
            } else {
                req.claimed = false
                next()
            }
    })
}
exports.checkReferrals = (req, res, next) => {
    let referredBy = req.session.referredBy || undefined
    if(referredBy !== undefined) {
        altcoin.exec('validateaddress', referredBy, (err, info) => {
            if(err) {
                console.log(`ERR ${JSON.stringify(err)}`);
            }
            if(info.isvalid == true) {
                Ref.find({'address' : req.body.address}, (err, results) => {
                    if(err) {
                        console.log(`ERR ${JSON.stringify(err)}`);
                    }
                    if(results.length > 0) {
                        req.addressStats.referredBy = results[0].referredBy;    
                        next()
                    } else {
                        let newRef = new Ref();
                        newRef.address = req.body.address
                        newRef.referredBy = referredBy
                        newRef.save((err) => {
                            if (err) (console.log(`ERROR ${err}`))
                            console.log(`newRef.referredBy ${newRef.referredBy}`)
                            req.addressStats.referredBy = newRef.referredBy;    
                            next();
                        })
                    }
                })
            } else {
                req.addressStats.referredBy = undefined
                req.flash('error', `Invalid ${config.coin.name} address of referral`)
                next();                   
            }
        })
    } else {
        Ref.findOne({'address' : req.body.address},'address referredBy', (err, ref) => {
            if(err) {
                console.log(`ERR ${JSON.stringify(err)}`);
            }
            if(ref !== null) {
                req.addressStats.referredBy = ref.referredBy;
                next()
            } else {
                req.addressStats.referredBy = undefined
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
    if(req.addressStats.referralCount > 0) {
        PaymentQ.aggregate([
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
                if(results.length > 0) {
                    req.addressStats.referralCommision = (results[0].amount).toFixed(8);
                    next()
                } else {
                    req.addressStats.referralCommision = 0;
                    next()
                }
        })
    } else {
        req.addressStats.referralCommision = 0;
        next()
    }
}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};