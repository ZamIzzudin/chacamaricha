import { chacha20poly1305 } from "@noble/ciphers/chacha.js";

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function encryptChacha(text: string, keyHex: string): string {
  const key = hexToBytes(keyHex);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const aad = crypto.getRandomValues(new Uint8Array(16));

  const cipher = chacha20poly1305(key, nonce, aad);
  const plaintext = new TextEncoder().encode(text);
  const encrypted = cipher.encrypt(plaintext);

  const result =
    bytesToHex(nonce) +
    bytesToHex(aad) +
    bytesToHex(encrypted);

  // cleanup
  key.fill(0);
  return result;
}

function splitEncryptedText(text: string) {
  return {
    ivString: text.slice(0, 24),
    assocDataString: text.slice(24, 56),
    encryptedDataString: text.slice(56),
  };
}

export function decryptChacha(text: string, keyHex: string): string {
  const key = hexToBytes(keyHex);
  const { ivString, assocDataString, encryptedDataString } =
    splitEncryptedText(text);

  const nonce = hexToBytes(ivString);
  const aad = hexToBytes(assocDataString);
  const ciphertext = hexToBytes(encryptedDataString);

  const cipher = chacha20poly1305(key, nonce, aad);
  const decrypted = cipher.decrypt(ciphertext);

  // cleanup
  key.fill(0);
  return new TextDecoder().decode(decrypted);
}
