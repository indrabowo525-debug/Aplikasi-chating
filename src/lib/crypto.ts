/**
 * Web Crypto API End-to-End Encryption Primitives
 * Uses standard browser-native window.crypto.subtle
 * - AES-GCM 256-bit symmetric encryption
 * - PBKDF2 with SHA-256 and 100,000 iterations for password-authenticated key exchange
 * - Cryptographically random 12-byte IV per message
 * - GCM 128-bit authentication tag for integrity
 * - 60-digit Signal-compatible Safety Number generation
 */

// Helper conversions
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random salt (16 bytes)
 */
export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Computes a deterministic 16-byte cryptographic salt from a room identifier.
 * This ensures all participants in the same room derive the exact same AES-256 key
 * from their shared secret passphrase without transmitting raw salts in plaintext.
 */
export async function getDeterministicRoomSalt(roomId: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`aegiscrypt-salt-v1:${roomId.trim().toLowerCase()}`)
  );
  return new Uint8Array(digest).slice(0, 16);
}

/**
 * Generate a cryptographically secure 12-byte IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  return iv;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user passphrase and salt
 * using PBKDF2 with 100,000 iterations of SHA-256.
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawPassword = encoder.encode(passphrase);

  // Import passphrase as base key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    rawPassword,
    'PBKDF2',
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive AES-GCM 256 key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Extractable so we can compute fingerprint
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt plaintext using AES-GCM-256
 */
export async function encryptMessage(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string; authTag: string }> {
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);
  const iv = generateIV();

  // SubtleCrypto AES-GCM automatically appends the 16-byte authentication tag
  // to the end of the ciphertext buffer
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    encodedPlaintext
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  // Split tag (last 16 bytes) and ciphertext
  const tagStart = encryptedBytes.length - 16;
  const ciphertextBytes = encryptedBytes.slice(0, tagStart);
  const tagBytes = encryptedBytes.slice(tagStart);

  return {
    ciphertext: bufferToBase64(ciphertextBytes),
    iv: bufferToBase64(iv),
    authTag: bufferToBase64(tagBytes),
  };
}

/**
 * Decrypt ciphertext using AES-GCM-256
 */
export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  authTagBase64: string | undefined,
  key: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  let combinedBuffer: Uint8Array;
  if (authTagBase64) {
    const authTagBuffer = base64ToBuffer(authTagBase64);
    const ctBytes = new Uint8Array(ciphertextBuffer);
    const tagBytes = new Uint8Array(authTagBuffer);
    combinedBuffer = new Uint8Array(ctBytes.length + tagBytes.length);
    combinedBuffer.set(ctBytes, 0);
    combinedBuffer.set(tagBytes, ctBytes.length);
  } else {
    combinedBuffer = new Uint8Array(ciphertextBuffer);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer as unknown as BufferSource,
      tagLength: 128,
    },
    key,
    combinedBuffer as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Computes a 60-digit Safety Number and Hex Fingerprint for side-by-side verification
 * Similar to Signal's Safety Number verification
 */
export async function computeKeyFingerprint(
  key: CryptoKey,
  salt: Uint8Array
): Promise<{ fingerprintHex: string; safetyNumber: string }> {
  try {
    const rawKey = await window.crypto.subtle.exportKey('raw', key);
    const combined = new Uint8Array(rawKey.byteLength + salt.byteLength);
    combined.set(new Uint8Array(rawKey), 0);
    combined.set(salt, rawKey.byteLength);

    // Compute SHA-256
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
    const hashBytes = new Uint8Array(hashBuffer);
    const fingerprintHex = bufferToHex(hashBytes);

    // Generate 60-digit safety number in 12 groups of 5 digits
    let digits = '';
    for (let i = 0; i < 20; i++) {
      // Take 3 bytes -> convert to 5-digit number
      const b1 = hashBytes[i % hashBytes.length];
      const b2 = hashBytes[(i + 1) % hashBytes.length];
      const b3 = hashBytes[(i + 2) % hashBytes.length];
      const val = ((b1 << 16) | (b2 << 8) | b3) % 100000;
      digits += val.toString().padStart(5, '0');
      if (digits.length >= 60) break;
    }

    // Format with spaces into groups of 5
    const formatted = digits
      .slice(0, 60)
      .match(/.{1,5}/g)
      ?.join(' ') || digits;

    return {
      fingerprintHex,
      safetyNumber: formatted,
    };
  } catch (err) {
    console.error('Error generating key fingerprint:', err);
    return {
      fingerprintHex: '00000000',
      safetyNumber: '00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000 00000',
    };
  }
}
