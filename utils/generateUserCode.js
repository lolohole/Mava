const User = require('../models/User');

async function generateUniqueUserCode() {
  while (true) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const code = `USR${randomNum}`;

    const exists = await User.findOne({ userCode: code });
    if (!exists) {
      return code;
    }
  }
}

module.exports = generateUniqueUserCode;
