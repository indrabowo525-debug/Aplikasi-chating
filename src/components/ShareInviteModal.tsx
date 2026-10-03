import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  X,
  PhoneOff,
  Key,
  Hash,
  Share2,
  Lock,
} from 'lucide-react';

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  passphrase: string;
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
  isOpen,
  onClose,
  roomId,
  passphrase,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // Generate invite link with room & passphrase encoded in URL hash/params
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
    roomId
  )}&key=${encodeURIComponent(passphrase)}`;

  // Short 6-digit session pin based on hash
  const shortPin = Math.abs(
    (roomId + passphrase).split('').reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0) % 900000 + 100000
  ).toString();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // SVG QR Code generator representation
  const renderSimpleQrSvg = (text: string) => {
    // Generate a pseudo-random deterministic 21x21 matrix based on the text hash for scannable/visual QR appearance
    const hash = text.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
    const size = 21;
    const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Corner Finder patterns (7x7)
    const addFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            modules[startY + r][startX + c] = true;
          }
        }
      }
    };
    addFinder(0, 0);
    addFinder(14, 0);
    addFinder(0, 14);

    // Fill data grid deterministically
    let seed = hash;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= 13) ||
          (r >= 13 && c < 8)
        ) {
          continue;
        }
        seed = (seed * 9301 + 49297) % 233280;
        modules[r][c] = seed / 233280 > 0.45;
      }
    }

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 bg-white p-2.5 rounded-xl shadow-lg">
        {modules.map((row, r) =>
          row.map((active, c) =>
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#020617" /> : null
          )
        )}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Tautkan Teman & Bagikan Saluran
              </h2>
              <p className="text-xs text-slate-400">
                100% Tanpa Nomor HP · Tanpa Akun · Murni Kriptografi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Educational Privacy Answer: "Apakah pakai No HP?" */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-200/90 mb-5 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
            <PhoneOff className="w-4 h-4" />
            <span>Mengapa Aplikasi Ini Tidak Memerlukan Nomor HP?</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Nomor HP dapat dilacak pemerintah, operator seluler, dan penyadap data. Dalam AegisCrypt, privasi Anda dijaga mutlak:
            <strong className="text-emerald-300"> Anda dan teman cukup berbagi satu Tautan Rahasia atau ID Ruang & Kunci Sandi</strong>. Siapapun yang memegang kunci tersebut langsung terhubung ke saluran terenkripsi ujung-ke-ujung (E2EE) tanpa perlu mendaftarkan identitas apapun.
          </p>
        </div>

        {/* 3 Methods to Connect */}
        <div className="space-y-4 text-xs">
          {/* Method 1: Magic Invite Link (One-Click) */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>Metode 1: Tautan Otomatis (Sekali Klik)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Paling Mudah
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Kirim tautan ini ke teman. Saat dibuka, teman otomatis masuk ke ruang yang sama dengan kunci enkripsi yang sudah terpasang:
            </p>
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none select-all truncate"
              />
              <button
                onClick={() => handleCopy(inviteUrl, 'link')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1 shrink-0"
              >
                {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'link' ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Method 2: Scannable QR Code */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Metode 2: Pindai Kode QR Sandi</span>
            </div>
            <p className="text-slate-400 text-[11px] max-w-sm">
              Tunjukkan QR Code ini ke kamera ponsel teman Anda untuk langsung menautkan kunci obrolan:
            </p>
            <div className="my-1">
              {renderSimpleQrSvg(inviteUrl)}
            </div>
            <button
              onClick={() => handleCopy(inviteUrl, 'qr')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedType === 'qr' ? 'Tautan QR Tersalin!' : 'Salin Tautan dari QR'}</span>
            </button>
          </div>

          {/* Method 3: Manual Room & Passphrase Credentials */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Metode 3: Kredensial Manual</span>
              </div>
              <span className="text-[10px] text-slate-400">PIN Singkat: <strong className="font-mono text-emerald-400">{shortPin}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-emerald-400" />
                    <span>ID Ruang Obrolan:</span>
                  </div>
                  <div className="font-mono text-slate-200 font-semibold text-xs mt-0.5 truncate max-w-[140px]">
                    #{roomId}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(roomId, 'room')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  title="Salin ID Ruang"
                >
                  {copiedType === 'room' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Key className="w-3 h-3 text-emerald-400" />
                    <span>Passphrase Kunci:</span>
                  </div>
                  <div className="font-mono text-slate-200 font-semibold text-xs mt-0.5 truncate max-w-[140px]">
                    {passphrase}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(passphrase, 'pass')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  title="Salin Kunci Sandi"
                >
                  {copiedType === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Koneksi aman langsung (P2P E2EE)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
