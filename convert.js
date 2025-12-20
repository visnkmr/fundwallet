const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

function convertAndSave() {
  // Read and parse JSON files
  const u = JSON.parse(fs.readFileSync('u.json', 'utf8'));
  const s = JSON.parse(fs.readFileSync('s.json', 'utf8'));

  // Combine into one object
  const combined = { u, s };

  // Stringify the combined JSON
  const jsonString = JSON.stringify(combined);

  // Compress with gzip
  const compressed = zlib.gzipSync(jsonString);

  // Encrypt with AES-GCM using a fixed key (32 bytes for AES-256)
  const key = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8'); // 32 bytes
  const iv = crypto.randomBytes(16); // 16 bytes IV

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(compressed);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Concatenate IV, encrypted data, and auth tag
  const result = Buffer.concat([iv, encrypted, authTag]);

  // Convert to Base64 for storage/transfer
  const base64 = result.toString('base64');

  // Save to file
  fs.writeFileSync('data.b64', base64);

  console.log('Conversion completed. File saved as data.b64');
}

// Run the conversion
convertAndSave();