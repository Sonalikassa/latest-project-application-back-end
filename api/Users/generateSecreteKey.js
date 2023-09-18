const fs = require('fs');
const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');
const config = {
  sessionSecret: secretKey,
};
fs.writeFileSync('config.json', JSON.stringify(config, null, 2));

