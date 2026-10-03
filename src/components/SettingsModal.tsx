import React, { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Volume2,
  EyeOff,
  Calculator,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { SecuritySettings } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SecuritySettings;
  onUpdateSettings: (newSettings: SecuritySettings) => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [localSettings, setLocalSettings] = useState<SecuritySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Pengaturan Privasi & Keamanan
              </h2>
              <p className="text-xs text-slate-400">
                Konfigurasi perisai data dan proteksi intrusi
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

        {/* Options List */}
        <div className="py-4 space-y-4 overflow-y-auto text-xs">
          {/* PIN Lock Settings */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200 text-sm">Kunci PIN Aplikasi</span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.isPinEnabled}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, isPinEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            {localSettings.isPinEnabled && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <label className="text-slate-400">PIN 4-6 Digit:</label>
                <input
                  type="password"
                  maxLength={6}
                  value={localSettings.pin}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, pin: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-28 text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Calculator Decoy Code */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-200 text-sm">Mode Kamuflase Kalkulator</span>
            </div>
            <p className="text-slate-400">
              Saat kamuflase aktif, tampilan berubah menjadi kalkulator fungsional biasa. Ketik kode rahasia ini lalu tekan tanda <span className="font-semibold text-slate-300">=</span> untuk kembali ke chat:
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Kode Rahasia Kalkulator:</span>
              <input
                type="text"
                value={localSettings.stealthCode}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, stealthCode: e.target.value })
                }
                className="w-24 text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Anti-Snoop / Auto Lock on Blur */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-slate-200 text-sm">Kunci Saat Pindah Tab</span>
                  <p className="text-slate-400 text-[11px]">
                    Otomatis mengunci layar ketika jendela browser kehilangan fokus.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoLockOnBlur}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoLockOnBlur: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Screen Shield (Frosted Blur) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-slate-200 text-sm">Pelindung Layar Anti-Intip</span>
                  <p className="text-slate-400 text-[11px]">
                    Samarkan teks pesan dengan efek blur sampai kursor diarahkan ke pesan.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.screenShieldEnabled}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, screenShieldEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Feedback */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-semibold text-slate-200 text-sm">Efek Suara Keamanan</span>
                  <p className="text-slate-400 text-[11px]">
                    Suara blip kripto saat pesan terkirim, diterima, dan dihancurkan.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, soundEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Reset All Local Data */}
          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between">
            <div>
              <span className="font-semibold text-rose-300 text-sm">Hapus Semua Data Lokal</span>
              <p className="text-rose-400/80 text-[11px]">
                Bersihkan kunci memori lokal dan setelan keamanan.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin menghapus seluruh data lokal dan me-reset kunci?')) {
                  onResetAllData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            AegisCrypt Zero-Knowledge Protocol
          </span>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Perubahan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
