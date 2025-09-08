const fs = require('fs');
const crypto = require('crypto');

(function generateAccessKeys() {
  const keys = {};

  for (let i = 0; i < 400; i++) {
    const key = generateUniqueKey();
    keys[key] = {
      maxDevices: 2,
      usedDevices: 0,
      browserFingerprints: [],
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
  }

  fs.writeFileSync('access_keys2.json', JSON.stringify(keys, null, 2));

  console.log('🔑 Access keys generated and saved to access_keys.json');
  console.log(`Generated ${Object.keys(keys).length} unique access keys`);

  function generateUniqueKey() {
    return crypto.randomBytes(16).toString('hex');
  }
})()
