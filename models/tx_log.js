const mongoose = require('mongoose');
const config = require('../config')

const txLogSchema = new mongoose.Schema({
		address : String,
		tx:  String,
		amount: Number,
	}, { timestamps: true });

const txLog = mongoose.model('txLog', txLogSchema, `${config.coin.name.toLowerCase()}.txlogs`);
module.exports = txLog;