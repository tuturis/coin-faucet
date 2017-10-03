const mongoose = require('mongoose');
const config = require('../config')

const pqSchema = new mongoose.Schema({
		address : String,
		ip:  String,
		amount: Number,
		claimed: {type: Boolean, default : false},
		ref: {type: Boolean, default : false},
	}, { timestamps: true });

const paymentQ = mongoose.model('paymentQ', pqSchema, `${config.coin.name.toLowerCase()}.paymentq`);
module.exports = paymentQ;