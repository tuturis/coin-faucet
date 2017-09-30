const mongoose = require('mongoose');

const refSchema = new mongoose.Schema({
		address : String,
		ip:  String,
		amount: Number,
		claimed: {type: Boolean, default : false}
	}, { timestamps: true });

const ref = mongoose.model('ref', refSchema);
module.exports = ref;