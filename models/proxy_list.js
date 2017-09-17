const mongoose = require('mongoose');

const pfSchema = new mongoose.Schema({
  ip:  { type: String, unique: true },
  }, { timestamps: false });

const Pf = mongoose.model('Pf', pfSchema);
module.exports = Pf;