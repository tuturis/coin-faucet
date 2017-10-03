const mongoose = require('mongoose');

const refSchema = new mongoose.Schema({
		address : { type: String, unique: true },
		referredBy : {type: String},
	}, 
	{ timestamps: true });

const ref = mongoose.model('ref', refSchema);
module.exports = ref;