const mongoose = require('mongoose');
const config = require('../config')

const sConfigSchema = new mongoose.Schema({
    siteConfig:{}
}, { timestamps: true });

const sConfig = mongoose.model('sConfig', sConfigSchema, `${config.coin.name.toLowerCase()}.config`);
module.exports = config;