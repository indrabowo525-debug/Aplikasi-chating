import React, { useState } from 'react';
import { ShieldCheck, Lock, Copy, Check, Key, Hash, AlertTriangle, FileCode } from 'lucide-react';
import { CryptoInspectionData } from '../types/chat';

interface CryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  safetyNumber: string;
  fingerprintHex: string;
  passphrase: string;
  saltHex: string;
  inspectionMessage?: CryptoInspectionData | null;
}

export const CryptoModal: React.FC<CryptoModalProps> = ({
  isOpen,
  onClose,
  safetyNumber,
  fingerprintHex,
  passphrase,
  saltHex,
  inspectionMessage,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'safety' | 'specs' | 'inspector'>(
    inspectionMessage ? 'inspector' : 'safety'
  );
  const [isVerified, setIsVerified] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Verifikasi Keamanan Kriptografi E2EE
              </h2>
              <p className="text-xs text-slate-400">
                Enkripsi Ujung-ke-Ujung Berbasis Web Crypto API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors text-sm px-2.5 py-1 rounded-md hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'safety'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Nomor Keamanan (Safety Number)
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Spesifikasi Kripto
          </button>
          {inspectionMessage && (
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'inspector'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Inspeksi Payload Pesan
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">
                    Sidik Jari Kunci Enkripsi (60 Digit)
                  </span>
                  <button
                    onClick={() => copyToClipboard(safetyNumber, 'safety')}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {copied === 'safety' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-center tracking-wider text-emerald-300 font-medium text-sm leading-relaxed p-3 bg-slate-900 rounded-lg select-all">
                  {safetyNumber}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Bandingkan nomor 60 digit ini dengan lawan bicara Anda. Jika nomor sama persis, jalur obrolan Anda 100% aman dari penyadapan (Man-In-The-Middle attack).
                </p>
              </div>

              {/* SHA-256 Hex Fingerprint */}
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-400">
                    SHA-256 Hex Fingerprint
                  </span>
                  <button
                    onClick={() => copyToClipboard(fingerprintHex, 'hex')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    {copied === 'hex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'hex' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-300 break-all bg-slate-900/80 p-2 rounded">
                  {fingerprintHex}
                </div>
              </div>

              {/* Verification Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isVerified ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Tandai Saluran Terverifikasi
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Konfirmasi bahwa nomor keamanan telah dicocokkan secara langsung.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsVerified(!isVerified)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isVerified
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isVerified ? 'Terverifikasi' : 'Verifikasi'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Algoritma Simetris</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    AES-GCM (256-bit)
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Galois/Counter Mode dengan autentikasi integritas data 128-bit bawaan untuk mencegah manipulasi pesan.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <Key className="w-3.5 h-3.5" />
                    <span>Derivasi Kunci Kripto</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    PBKDF2 (SHA-256)
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    100.000 iterasi dengan salt 16-byte acak kriptografis untuk mencegah serangan brute-force dan rainbow table.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Initialization Vector (IV)</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    96-bit (12 bytes) Acak
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    IV unik dihasilkan untuk setiap pesan menggunakan CSPRNG browser (`crypto.getRandomValues`).
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Arsitektur Zero-Knowledge</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    Server Buta (Blind Relay)
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Server hanya meneruskan ciphertext Base64. Kunci privat tidak pernah meninggalkan memori browser klien.
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300/90 leading-relaxed">
                <span className="font-semibold text-emerald-400">Garansi Privasi:</span> Semua proses enkripsi dan dekripsi dieksekusi langsung pada perangkat pengguna melalui Web Crypto API standar (`window.crypto.subtle`). Tidak ada pihak ketiga maupun server yang dapat membaca isi pesan teks atau media Anda.
              </div>
            </div>
          )}

          {activeTab === 'inspector' && inspectionMessage && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Berikut adalah data mentah paket terenkripsi yang dikirimkan melalui jaringan:
              </div>

              {inspectionMessage.plaintext && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                  <div className="text-xs font-semibold text-emerald-400 mb-1">
                    Teks Asli (Terdekripsi di Sisi Klien):
                  </div>
                  <div className="text-sm text-slate-100 font-medium">
                    "{inspectionMessage.plaintext}"
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Ciphertext Terenkripsi (Base64):</div>
                  <div className="font-mono text-emerald-400 break-all p-2 bg-slate-900 rounded mt-1 select-all">
                    {inspectionMessage.ciphertext}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-slate-400 font-medium">IV (12 Bytes Base64):</div>
                    <div className="font-mono text-slate-200 break-all p-1.5 bg-slate-900 rounded mt-1">
                      {inspectionMessage.iv}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Authentication Tag:</div>
                    <div className="font-mono text-slate-200 break-all p-1.5 bg-slate-900 rounded mt-1">
                      {inspectionMessage.authTag || 'Integrated GCM Tag'}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-slate-400 font-medium">Mode Privasi:</div>
                  <div className="text-slate-300 mt-0.5">
                    {inspectionMessage.isBurnAfterReading
                      ? '🔥 Burn After Reading (Hancur setelah dibuka)'
                      : inspectionMessage.timerSeconds > 0
                      ? `⏱️ Otomatis Terhapus dalam ${inspectionMessage.timerSeconds} detik`
                      : '🔒 Terenkripsi Standar'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
