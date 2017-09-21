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
            balance: balance 
        })
    })
};
exports.post = (req, res) => {
    if (!req.recaptcha.error) {
        altcoin.exec('validateaddress', req.body.address, (err, info) => {
            if(err) {
                req.flash('error', {message : 'invalid coin address, try again'})
                res.redirect('/')                
            }
            let pq = new PaymentQ()
            pq.address = req.address;
            pq.ip = req.ip;
            pq.amount = getRandomArbitrary(config.payout.min, config.payout.max)
            pq.save((err) => {
                if(err) {
                    req.flash('error', {message : 'Internal error'})
                    res.redirect('/');
                }
                    req.flash('success', {message : 'Your payout is under way!'})
                    res.redirect('/');      
            });
        }) 
    } else {
        req.flash('error', {message : 'invalid reCaptcha, try again'})
        res.redirect('/')
    }
};
exports.proxyFilter = (req, res, next) => {
    proxy_list.findOne({ip : req.ip}, (err, result) => {
        if(result.length) {
            req.flash('error', {message : 'Requests from TOR or Proxy services is not allowed due to abuse'})
            res.redirect('/');
        } else {
            next();
        }
    })
};
exports.checkClaimed = (req, res, next) => {

}
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
};