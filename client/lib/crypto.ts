const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

let cachedKey: CryptoKey | null = null;

async function fetchPublicKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const res = await fetch(`${API_URL}/auth/public-key`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch public key');

  const { publicKey: pem } = await res.json();

  // Strip PEM headers and decode base64 to binary
  const pemBody = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s+/g, '');

  const binary = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  cachedKey = await window.crypto.subtle.importKey(
    'spki',
    binary.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,      // not extractable — key stays locked inside the browser
    ['encrypt']
  );

  return cachedKey;
}

export async function encryptPassword(plaintext: string): Promise<string> {
  const key = await fetchPublicKey();

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Base64-encode the encrypted bytes for safe JSON transport
  const bytes = new Uint8Array(encrypted);
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
}
