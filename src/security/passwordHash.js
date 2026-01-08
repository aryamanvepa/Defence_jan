import crypto from "crypto";

export function verifyPbkdf2Sha256(password, encoded) {
  const parts = encoded.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;

  const iters = parseInt(parts[1], 10);
  const salt = b64urlToBuf(parts[2]);
  const expected = b64urlToBuf(parts[3]);

  const actual = crypto.pbkdf2Sync(password, salt, iters, expected.length, "sha256");
  return crypto.timingSafeEqual(actual, expected);
}

function b64urlToBuf(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

