const sConfig = require('../models/sConfig')

exports.getConfig = (cb) => {
    let config = {}
    sConfig.find({})
        .sort({ 'createdAt': -1 })
        .limit(1)
        .exec((err, c) => {
            cb(err, c[0].siteConfig)
        })
}

exports.init = (cb) => {
    sConfig.count({}, (err, count) => {
        if (count > 5) {
            cb('config already exits.. skiping')
        } else {
            iConfig = new sConfig()
            iConfig.siteConfig = {
                payout: {
                    min: 0.0001,
                    max: 0.001,
                    interval: 1,
                    treshold: 0.003,
                    referralCommision: 0.05,
                },
                coin: {
                    ticker: "ONION",
                    decimals: 8,
                    name: "DeepOnion",
                    address: "DmkLHSA2nPrznFRhoyQ2hZEVwstK4kxtNz",
                    info: "Deep Onion coins are Freely airdropped/distributed! NO ICO/Crowdfunding! Deep Onion is a hybrid cryptocurrency that uses proof of stake (PoS) and the X13 proof of work (PoW) algorithm. It is natively integrated with the TOR network and ALL connections are made over the TOR network. DeepOnion increase the level of privacy for crypto users to reduce the likelihood of being hacked or attacked by other legal & illegal entities. With DeepOnion, you can send and receive onions (ONION) over the TOR network. Click here to learn more... Security will be further enhanced by DeepSend technologies, to be announced and implemented later. our Anonymity is guaranteed! DeepOnion dev team is composed of industrial, social media, SEM experts and top level block-chain developers. More advanced features will be added to the coin, and the dev team is committed to long term support. The best part is that we DO NOT do ICOs or crowdfunding. 90% of total coins are premined at genesis block. The remaining 10% will be mineable by the public. Most premined coins will be freely airdropped to the community through many rounds of airdrops (detailed herein). Certain conditional requirements apply, please read on for details. Genesis block, premined coins, breakdown; 70% will be air-dropped to the community, while 20% will be used for bounties, rewards and other promotions. Remaining 10% will belong to the dev team. Deep Onion Website: https:\/\/deeponion.org"
                },
                site: {
                    name: "onionfaucet.win",
                    explorer: "https://prohashing.com/explorer/Deeponion/"
                },
                ads: {
                    coinurl: "66663",
                    aads: "675642",
                    top: "",
                    top2: [{ "type": "Element", "tagName": "iframe", "attributes": { "dataset": { "aa": 675642 }, "src": "//ad.a-ads.com/675642?size=728x90", "scrolling": "no", "style": { "margin": "0 auto", "width": "728px", "height": "90px", "border": "0px", "padding": 0, "overflow": "hidden" }, "allowtransparency": "true" }, "children": [] }],
                    left: [{ "type": "Element", "tagName": "a", "attributes": { "href": "https://cex.io/r/0/up105394792/0/", "target": "_blank" }, "children": [{ "type": "Element", "tagName": "img", "attributes": { "src": "https://cex.io/rb/CEX-3-160x600.png", "alt": "CEX.IO Bitcoin Exchange", "width": 160, "height": 600, "border": 0 }, "children": [] }] }],
                    right: [{ "type": "Element", "tagName": "iframe", "attributes": { "dataset": { "aa": 680336 }, "src": "//ad.a-ads.com/680336?size=120x600", "scrolling": "no", "style": { "width": "120px", "height": "600px", "border": "0px", "padding": 0, "overflow": "hidden" }, "allowtransparency": "true" }, "children": [] }],
                },
                analytics: {
                    google: "UA-106566819-1",
                },
                exchanges: [{
                    name: 'cryptopia',
                    url: 'https://www.cryptopia.co.nz/Exchange/?market=ONION_BTC&referrer=cryptpiaff',
                    avatar: 'http://i.imgur.com/nSUbpiq.png',
                    description: 'Established exchange with support for many altcoins and unique features such as marketplace for goods'
                }]
            }
            iConfig.save().then(cb(null, 'init config success'))
        }
    })
}
