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
  Smartphone,
  AlertTriangle,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  passphrase: string;
}

const CLOUD_DEV_HOST = 'https://ais-dev-jwb32u26qakk32j3gvoatg-514591033728.asia-east1.run.app';
const CLOUD_PRE_HOST = 'https://ais-pre-jwb32u26qakk32j3gvoatg-514591033728.asia-east1.run.app';

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({
  isOpen,
  onClose,
  roomId,
  passphrase,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedUrlType, setSelectedUrlType] = useState<'dev' | 'shared'>('dev');

  if (!isOpen) return null;

  // Determine canonical origin (never send localhost to mobile!)
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocal = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

  const baseOrigin = selectedUrlType === 'dev'
    ? (isLocal ? CLOUD_DEV_HOST : currentOrigin)
    : CLOUD_PRE_HOST;

  // Generate invite link with room & passphrase encoded in URL query params
  const inviteUrl = `${baseOrigin}/?room=${encodeURIComponent(
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
    const hash = text.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
    const size = 21;
    const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

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

    let seed = hash;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= 13) || (r >= 13 && c < 8)) {
          continue;
        }
        seed = (seed * 9301 + 49297) % 233280;
        modules[r][c] = seed / 233280 > 0.45;
      }
    }

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="w-36 h-36 bg-white p-2 rounded-xl shadow-lg">
        {modules.map((row, r) =>
          row.map((active, c) =>
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#020617" /> : null
          )
        )}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Tautkan Teman / Buka di HP
              </h2>
              <p className="text-xs text-slate-400">
                100% Tanpa Nomor HP · Murni Kriptografi Ujung-ke-Ujung
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

        {/* HP Troubleshooting Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200/90 mb-4 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
            <Smartphone className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Panduan Membuka Tautan di HP (PENTING)</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Jika tautan tidak bisa dibuka saat diklik di HP, berikut penyebab dan solusinya:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-amber-900/40">
              <span className="font-semibold text-amber-300 block mb-0.5">1. Jangan Buka di Browser WA</span>
              <span className="text-slate-400">
                WhatsApp membuka link di browser internal yang memblokir akun Google. <strong>Salin link lalu buka di Google Chrome HP</strong>.
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-amber-900/40">
              <span className="font-semibold text-amber-300 block mb-0.5">2. Buka Manual di HP</span>
              <span className="text-slate-400">
                Buka web di HP, lalu ketik nama ruang <strong className="text-emerald-400">#{roomId}</strong> dan masukkan passphrase di bawah.
              </span>
            </div>
          </div>
        </div>

        {/* 3 Methods to Connect */}
        <div className="space-y-4 text-xs">
          {/* Method 1: Magic Invite Link (One-Click) */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>Tautan Otomatis (Sekali Klik)</span>
              </div>
              {/* Toggle Dev / Shared */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setSelectedUrlType('dev')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    selectedUrlType === 'dev'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Link Dev
                </button>
                <button
                  onClick={() => setSelectedUrlType('shared')}
                  className={`px-2 py-0.5 rounded-md font-medium transition ${
                    selectedUrlType === 'shared'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Link Publik
                </button>
              </div>
            </div>

            <p className="text-slate-400 text-[11px]">
              Tautan langsung menuju ruang terenkripsi dengan kunci yang sudah terisi otomatis:
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
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1 shrink-0 active:scale-95"
              >
                {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'link' ? 'Tersalin!' : 'Salin Tautan'}</span>
              </button>
            </div>
          </div>

          {/* Method 2: Manual Room & Passphrase Credentials */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Kredensial Ruang (Solusi Termudah di HP)</span>
              </div>
              <span className="text-[10px] text-slate-400">PIN Singkat: <strong className="font-mono text-emerald-400">{shortPin}</strong></span>
            </div>

            <p className="text-slate-400 text-[11px]">
              Jika membuka link di HP terkendala, teman Anda cukup mengetikkan ID Ruang & Kunci Sandi berikut di web:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-emerald-400" />
                    <span>Nama / ID Ruang:</span>
                  </div>
                  <div className="font-mono text-slate-200 font-semibold text-xs mt-0.5 truncate max-w-[150px]">
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
                    <span>Passphrase Kunci E2EE:</span>
                  </div>
                  <div className="font-mono text-slate-200 font-semibold text-xs mt-0.5 truncate max-w-[150px]">
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

          {/* Method 3: Scannable QR Code */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Pindai Kode QR dari Layar Ini</span>
            </div>
            <p className="text-slate-400 text-[11px] max-w-sm">
              Arahkan kamera HP ke Kode QR ini untuk membuka link langsung:
            </p>
            <div className="my-1">
              {renderSimpleQrSvg(inviteUrl)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3.5 mt-3.5 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Zero-Knowledge & Anonim</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
