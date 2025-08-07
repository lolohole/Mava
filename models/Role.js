const mongoose = require('mongoose');

// نموذج Role
const Role = mongoose.model('Role', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [String]
}));

module.exports = Role;
