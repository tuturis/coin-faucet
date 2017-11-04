const sConfig = require('../models/sConfig')

exports.getConfig = (cb) => {
    let config = {}
    sConfig.find({})
      .sort({ 'createdAt' : -1 })
      .limit(1)
      .exec((err, c) => {
            cb(err, c[0].siteConfig)
      })
}

exports.init = (cb) => {
    sConfig.count({}, (err, count) => {
        if (count > 11) {
            cb('config already exits.. skiping')
        } else {
            iConfig = new sConfig()
            iConfig.siteConfig = {
                payout: {
                    min: 0.00001,
                    max: 0.0001,
                    interval: 1,
                    treshold: 0.004,
                    referralCommision: 0.07,
                    profit: 0.5                    
                },
                coin: {
                    ticker: 'LTC',
                    decimals: 7,
                    name: "Litecoin",
                    address: "Lh3eALGy4TESMDayoumncyDFGtH2f6bm44",
                    info: "Litecoin is a peer-to-peer Internet currency that enables instant, near-zero cost payments to anyone in the world. Litecoin is an open source, global payment network that is fully decentralized without any central authorities. Mathematics secures the network and empowers individuals to control their own finances. Litecoin features faster transaction confirmation times and improved storage efficiency than the leading math-based currency. With substantial industry support, trade volume and liquidity, Litecoin is a proven medium of commerce complementary to Bitcoin"
                },
                site: {
                    name: "litefaucet.win",
                    explorer: "https://live.blockcypher.com/ltc/tx/",
                    captchaHashes: 5120
                },
                ads: {
                    aads: "676012",
                    coinurl: "66674",
                    top: "",
                    top2: [{ "type": "Element", "tagName": "iframe", "attributes": { "dataset": { "aa": 676012 }, "src": "//ad.a-ads.com/676012?size=728x90", "scrolling": "no", "style": { "margin": "0 auto", "width": "728px", "height": "90px", "border": "0px", "pad\nding": 0, "overflow": "hidden" }, "allowtransparency": "true" }, "children": [] }],
                    right: '',
                    left: [{ "type": "Element", "tagName": "a", "attributes": { "href": "https://cex.io/r/0/up105394792/0/", "target": "_blank", "style": { "float": "right" } }, "children": [{ "type": "Element", "tagName": "img", "attributes": { "src": "https://cex.io/rb/CEX-3-160x600.png", "alt": "CEX.IO Bitcoin Exchange", "width": 160, "height": 600, "border": 0 }, "children": [] }] }],

                },
                analytics: {
                    google: "UA-106566819-2"
                },
                exchanges: [{
                    name: 'cryptopia',
                    url: 'https://www.cryptopia.co.nz/Exchange/?market=LTC_BTC&referrer=cryptpiaff',
                    avatar: 'https://i.imgur.com/nSUbpiq.png',
                    description: 'Established exchange with support for many altcoins and unique features such as marketplace for goods'
                }, {
                    name: 'c-cex.com',
                    url: 'https://c-cex.com/?p=ltc-btc&rf=FECEAFAABCEB70DC',
                    avatar: 'https://www.cryptocompare.com/media/20008/ccex-logo.png?width=200',
                    description: 'Easy to use, anonymous friendly, wide varaiety of altcoins to trade'
                }, {
                    name: 'cex.io',
                    url: 'https://cex.io/r/0/up105394792/0',
                    avatar: 'https://lh3.googleusercontent.com/pPihmJ3lDGIpgegOSFkN1r5HJxaxPgTMoD0jlkxXEFoxy1FjRGp4gMsmw0hnYn_xVBo=w100',
                    description: 'Easy to use, secure, cashout to Fiat currency'
                }]
            }
            iConfig.save().then(cb(null, 'init config success'))
        }
    })
}
