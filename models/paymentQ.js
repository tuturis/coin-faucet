const mongoose = require('mongoose');

const pqSchema = new mongoose.Schema({
		address : String,
		ip:  String,
		amount: Number,
		claimed: {type: Boolean, default : false}
	}, { timestamps: true });

const paymentQ = mongoose.model('paymentQ', pqSchema);
module.exports = paymentQ;