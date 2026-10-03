import React, { useState } from 'react';
import { Lock, Fingerprint, KeyRound, ShieldAlert } from 'lucide-react';
import { playUnlockSound } from '../lib/sound';

interface LockScreenProps {
  onUnlock: () => void;
  correctPin: string;
  soundEnabled: boolean;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  correctPin,
  soundEnabled,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);

  const handleDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);

      if (nextPin === correctPin) {
        playUnlockSound(soundEnabled);
        setTimeout(onUnlock, 150);
      } else if (nextPin.length >= correctPin.length) {
        // Incorrect PIN
        setErrorShake(true);
        setTimeout(() => {
          setPinInput('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const triggerBiometric = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      playUnlockSound(soundEnabled);
      onUnlock();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none">
      <div className={`w-full max-w-xs flex flex-col items-center ${errorShake ? 'animate-shake' : ''}`}>
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          AegisCrypt Terkunci
        </h1>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
          Masukkan PIN keamanan untuk mengakses obrolan terenkripsi
        </p>

        {/* PIN Dots Indicator */}
        <div className="flex items-center gap-3 mb-8">
          {Array.from({ length: correctPin.length || 4 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                idx < pinInput.length
                  ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xl font-medium hover:bg-slate-800/80 active:scale-95 transition-all shadow-sm"
            >
              {num}
            </button>
          ))}

          <button
            onClick={triggerBiometric}
            disabled={biometricScanning}
            className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center hover:bg-slate-800/80 active:scale-95 transition-all"
            title="Pindai Biometrik"
          >
            <Fingerprint className={`w-6 h-6 ${biometricScanning ? 'animate-pulse text-emerald-300' : ''}`} />
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xl font-medium hover:bg-slate-800/80 active:scale-95 transition-all shadow-sm"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm font-medium hover:bg-slate-800/80 active:scale-95 transition-all flex items-center justify-center"
          >
            Hapus
          </button>
        </div>

        {/* Biometric Scan Prompt */}
        <button
          onClick={triggerBiometric}
          className="mt-6 flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors py-2 px-3 rounded-lg hover:bg-slate-900"
        >
          <Fingerprint className="w-4 h-4 text-emerald-500" />
          <span>{biometricScanning ? 'Memverifikasi sidik jari...' : 'Buka dengan Sensor Biometrik'}</span>
        </button>

        <div className="mt-4 text-[11px] text-slate-400 text-center">
          Default PIN: <span className="font-mono text-slate-400">{correctPin}</span>
        </div>
      </div>
    </div>
  );
};
