const { generateKeyPairSync, privateDecrypt, constants } = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '..', '..', '.keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

let _publicKey = null;
let _privateKey = null;

const loadOrGenerateKeys = () => {
  if (_publicKey && _privateKey) return;

  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    _privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    _publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    console.log('RSA key pair loaded from disk');
    return;
  }

  // First run — generate and persist so restarts don't invalidate browser-cached keys
  if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true });

  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  _publicKey = pair.publicKey;
  _privateKey = pair.privateKey;

  fs.writeFileSync(PRIVATE_KEY_PATH, _privateKey, { mode: 0o600 }); // owner read-only
  fs.writeFileSync(PUBLIC_KEY_PATH, _publicKey, { mode: 0o644 });
  console.log('RSA key pair generated and saved');
};

const getPublicKey = () => {
  loadOrGenerateKeys();
  return _publicKey;
};

const decryptPassword = (encryptedBase64) => {
  loadOrGenerateKeys();
  try {
    const decrypted = privateDecrypt(
      {
        key: _privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedBase64, 'base64')
    );
    return decrypted.toString('utf8');
  } catch {
    throw Object.assign(new Error('Invalid encrypted payload'), { status: 400 });
  }
};

module.exports = { getPublicKey, decryptPassword };
