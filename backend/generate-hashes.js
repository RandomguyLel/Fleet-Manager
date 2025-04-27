// filepath: c:\Users\ritva\Desktop\TMS\Fleet Manager\backend\generate-hashes.js
const bcrypt = require('bcrypt');

async function generateHashes() {
  const passwords = ['admin123', 'manager123', 'user123'];
  const saltRounds = 10;
  
  for (const password of passwords) {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Password: ${password}, Hash: ${hash}`);
  }
}

generateHashes();