import crypto from "crypto";

/**
 * Generate PBKDF2-SHA256 password hash in format:
 * pbkdf2_sha256$<iters>$<salt_b64url>$<derivedKey_b64url>
 */
function hashPassword(password, iterations = 210000) {
  const salt = crypto.randomBytes(16);
  const keyLen = 32;
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keyLen, "sha256");
  
  const saltB64url = bufToB64url(salt);
  const derivedB64url = bufToB64url(derived);
  
  return `pbkdf2_sha256$${iterations}$${saltB64url}$${derivedB64url}`;
}

function bufToB64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Usage: node scripts/generate-password-hash.js <password>
const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/generate-password-hash.js <password>");
  process.exit(1);
}

console.log(hashPassword(password));

