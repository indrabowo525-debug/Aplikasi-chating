export type TimerOption = 0 | 5 | 15 | 30 | 60 | 300 | 3600 | 86400 | -1;
// 0 = Off (Permanent until wiped)
// -1 = Burn After Reading (1x View)
// >0 = Seconds from send/receive

export interface EncryptedMessagePayload {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  ciphertext: string;       // Base64 AES-GCM encrypted
  iv: string;               // Base64 Initialization Vector (12 bytes)
  authTag?: string;         // Base64 authentication tag (16 bytes)
  keyFingerprint?: string;  // First 8 hex chars of derived key hash
  salt: string;             // Base64 salt used for PBKDF2
  timestamp: number;
  timerSeconds: number;     // Ephemeral timer duration
  isBurnAfterReading: boolean;
  burnRevealedAt?: number;
  burnCountdown?: number;
  expiresAt?: number;
  mediaType?: 'text' | 'image';
  fileName?: string;
  fileSize?: number;
}

export interface DecryptedMessage extends EncryptedMessagePayload {
  plaintext?: string;
  decryptionError?: boolean;
  decryptedAt?: number;
  remainingSeconds?: number;
  isShredded?: boolean;
}

export interface RoomParticipantInfo {
  userId: string;
  userName: string;
  publicKey?: string;
}

export interface SecuritySettings {
  pin: string;
  isPinEnabled: boolean;
  autoLockOnBlur: boolean;
  autoLockMinutes: number; // 0 = never, 1, 5, 15
  soundEnabled: boolean;
  screenShieldEnabled: boolean; // Frosted blur over messages until hover/focus
  stealthCode: string; // PIN for calculator decoy mode
}

export interface CryptoInspectionData {
  messageId: string;
  senderName: string;
  timestamp: number;
  ciphertext: string;
  iv: string;
  authTag?: string;
  salt: string;
  keyFingerprint?: string;
  plaintext?: string;
  isBurnAfterReading: boolean;
  timerSeconds: number;
}
