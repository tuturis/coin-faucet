const altcoin = require('node-altcoin')();
const toHTML = require('himalaya/translate').toHTML

const PaymentQ = require('../models/paymentQ');
const proxy_list = require('../models/proxy_list');
const Ref = require('../models/ref');
const Tx_logs = require('../models/tx_log');

altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpchost)
altcoin.set({port:process.env.rpcport})
/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
    let top   = req.config.ads.top !== ""  ? toHTML(req.config.ads.top)    : undefined 
    let top2  = req.config.ads.top2 !== "" ? toHTML(req.config.ads.top2)  : undefined
    let right = req.config.ads.right !== ""? toHTML(req.config.ads.right) : undefined
    let left  = req.config.ads.left !== ""  ? toHTML(req.config.ads.left)  : undefined

    res.render('home', {
        title: `${req.config.coin.name} Faucet`,
        captcha: req.captcha,
        balance: req.faucetBalance,
        addressBalance : req.addressBalance,
        recentTxs : req.addressStats.recentTx,
        info : {
            blockexpl : req.config.site.explorer,
            coinTicker: req.config.coin.ticker,
            coinName : req.config.coin.name,
            claim : (req.config.payout.claim).toFixed(req.config.coin.decimals),
            referralCommision : (req.config.payout.referralCommision * 100).toFixed(2),
            treshold : req.config.payout.treshold,
            interval : req.config.payout.interval,
            address  : req.config.coin.address,
            coinInfo : req.config.coin.info,
            aads     : req.config.ads.aads,
            coinurl  : req.config.ads.coinurl,
            ganalytics : req.config.analytics.google,
            siteName : req.config.site.name 
        },
        ads: {
            top: top,  
            top2: top2,
            right: right,
            left: left,
        },
        exchanges: req.config.exchanges 
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
    let claim = getRandomArbitrary(req.config.payout.min, req.config.payout.max).toFixed(req.config.coin.decimals)
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
                    let refClaim = (claim * req.config.payout.referralCommision).toFixed(req.config.coin.decimals)
                    refPq.address = req.addressStats.referredBy
                    refPq.ref = true
                    refPq.amount = refClaim 
                    refPq.save((err) => {
                        req.flash('success',`Your claim of ${claim} ${req.config.coin.name} is under way!`)
                        next()
                    })
                } else {
                    req.flash('success',`Your claim of ${claim} ${req.config.coin.name} is under way!`)
                    next()
                }
            });
        } else {
            req.flash('error', `You can claim coins only every ${req.config.payout.interval} hours per same IP or ${req.config.coin.name} address`)
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
            req.flash('error', `Invalid ${req.config.coin.name} address`)
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
            req.addressStats.totalBalance = (result[0].balance.toFixed(req.config.coin.decimals))
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
    let interval = now.setHours(now.getHours() - req.config.payout.interval) 
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
                req.flash('error', `Invalid ${req.config.coin.name} address of referral`)
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