import React, { useState, useEffect } from 'react';
import {
  Lock,
  Flame,
  Clock,
  Trash2,
  Code2,
  Eye,
  CheckCheck,
  AlertCircle,
  FileImage,
} from 'lucide-react';
import { DecryptedMessage, CryptoInspectionData } from '../types/chat';

interface MessageItemProps {
  message: DecryptedMessage;
  currentUserId: string;
  onRevealBurn: (messageId: string) => void;
  onShredMessage: (messageId: string) => void;
  onInspectCrypto: (data: CryptoInspectionData) => void;
  screenShieldEnabled: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onRevealBurn,
  onShredMessage,
  onInspectCrypto,
  screenShieldEnabled,
}) => {
  const isMine = message.senderId === currentUserId;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(
    !message.isBurnAfterReading || isMine || !!message.burnRevealedAt
  );

  // Calculate live countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const updateRemaining = () => {
      if (message.expiresAt) {
        const diffMs = message.expiresAt - Date.now();
        const diffSec = Math.max(0, Math.ceil(diffMs / 1000));
        setSecondsLeft(diffSec);

        if (diffSec <= 0) {
          // Time expired
          if (interval) clearInterval(interval);
        }
      } else if (message.timerSeconds > 0 && !message.isBurnAfterReading) {
        // Calculate based on timestamp
        const expiry = message.timestamp + message.timerSeconds * 1000;
        const diffMs = expiry - Date.now();
        const diffSec = Math.max(0, Math.ceil(diffMs / 1000));
        setSecondsLeft(diffSec);
      }
    };

    updateRemaining();
    interval = setInterval(updateRemaining, 500);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [message.expiresAt, message.timestamp, message.timerSeconds, message.burnRevealedAt]);

  const handleRevealClick = () => {
    setIsRevealed(true);
    onRevealBurn(message.id);
  };

  const handleInspect = () => {
    onInspectCrypto({
      messageId: message.id,
      senderName: message.senderName,
      timestamp: message.timestamp,
      ciphertext: message.ciphertext,
      iv: message.iv,
      authTag: message.authTag,
      salt: message.salt,
      keyFingerprint: message.keyFingerprint,
      plaintext: message.plaintext,
      isBurnAfterReading: message.isBurnAfterReading,
      timerSeconds: message.timerSeconds,
    });
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} my-2 group`}>
      {/* Sender metadata */}
      <div className="flex items-center gap-1.5 px-1 mb-1 text-[11px] text-slate-400">
        <span className="font-medium text-slate-400">
          {isMine ? 'Anda' : message.senderName}
        </span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>{formattedTime}</span>

        {message.keyFingerprint && (
          <>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-[10px] text-emerald-400/80" title="Key Hash Fingerprint">
              #{message.keyFingerprint.substring(0, 6)}
            </span>
          </>
        )}
      </div>

      {/* Main Bubble Container */}
      <div
        className={`relative max-w-[88%] sm:max-w-md md:max-w-lg rounded-2xl p-3.5 shadow-md border transition-all ${
          isMine
            ? 'bg-emerald-950/40 border-emerald-800/40 text-slate-100 rounded-tr-sm'
            : 'bg-slate-900 border-slate-800 text-slate-100 rounded-tl-sm'
        }`}
      >
        {/* Ephemeral Timer Bar */}
        {(message.timerSeconds > 0 || message.burnRevealedAt) && secondsLeft !== null && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px]">
            <div className="flex items-center gap-1 text-amber-400 font-medium">
              <Flame className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>
                {message.isBurnAfterReading ? 'Hancur dalam:' : 'Otomatis terhapus:'}{' '}
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {secondsLeft}s
                </span>
              </span>
            </div>

            {/* Micro visual progress indicator */}
            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (secondsLeft /
                        (message.isBurnAfterReading
                          ? (message.burnCountdown || 10)
                          : message.timerSeconds)) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Burn After Reading Mask (when not yet revealed by recipient) */}
        {message.isBurnAfterReading && !isMine && !message.burnRevealedAt && !isRevealed ? (
          <div className="py-3 px-2 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-xs font-semibold text-slate-200">
              Pesan Rahasia Sekali Buka (Burn After Reading)
            </div>
            <div className="text-[11px] text-slate-400 mt-1 mb-3 max-w-xs">
              Isi pesan terenkripsi. Begitu Anda membukanya, timer 10 detik akan aktif dan pesan akan musnah selamanya.
            </div>
            <button
              onClick={handleRevealClick}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-transform active:scale-95 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ketuk untuk Membuka & Picu Penghancuran</span>
            </button>
          </div>
        ) : (
          /* Normal / Revealed Message Content */
          <div className="space-y-2">
            {/* Decryption Error notice if keys didn't match */}
            {message.decryptionError ? (
              <div className="flex items-center gap-2 text-rose-400 text-xs py-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Gagal mendekripsi: Kunci sandi ruang obrolan tidak cocok.</span>
              </div>
            ) : (
              <>
                {/* Media Image */}
                {message.mediaType === 'image' && message.plaintext && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 my-1 bg-slate-950">
                    <img
                      src={message.plaintext}
                      alt="Gambar terenkripsi"
                      className="max-h-72 w-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Text Body */}
                {message.mediaType !== 'image' && (
                  <div
                    className={`text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      screenShieldEnabled ? 'blur-sm hover:blur-none transition-all' : ''
                    }`}
                  >
                    {message.plaintext || (
                      <span className="font-mono text-xs text-slate-400 italic">
                        [Memproses dekripsi AES-256...]
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Burn note for sender */}
            {message.isBurnAfterReading && isMine && !message.burnRevealedAt && (
              <div className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-1 pt-1 border-t border-white/5">
                <Flame className="w-3 h-3" />
                <span>Pesan rahasia sekali buka (akan musnah 10 detik saat dibuka penerima)</span>
              </div>
            )}
          </div>
        )}

        {/* Message Footer / Controls */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5 text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            {/* E2EE indicator */}
            <span
              className="flex items-center gap-1 text-emerald-400/80 cursor-pointer hover:text-emerald-300"
              onClick={handleInspect}
              title="Periksa Paket Enkripsi (Raw Ciphertext)"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>AES-256</span>
            </span>

            {/* Timer badge */}
            {message.timerSeconds > 0 && (
              <span className="flex items-center gap-0.5 text-slate-400">
                <Clock className="w-2.5 h-2.5" />
                <span>{message.timerSeconds}s</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Crypto Inspect trigger */}
            <button
              onClick={handleInspect}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              title="Inspeksi Kriptografi Pesan"
            >
              <Code2 className="w-3 h-3" />
            </button>

            {/* Manual Shred Button */}
            <button
              onClick={() => onShredMessage(message.id)}
              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Musnahkan Pesan Ini Sekarang"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {isMine && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
        </div>
      </div>
    </div>
  );
};
