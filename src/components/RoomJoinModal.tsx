import React, { useState } from 'react';
import { Shield, Key, Hash, User, ArrowRight, Sparkles, X } from 'lucide-react';

interface RoomJoinModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onJoin: (roomId: string, passphrase: string, userName: string) => void;
  initialRoomId: string;
  initialPassphrase: string;
  initialUserName: string;
}

export const RoomJoinModal: React.FC<RoomJoinModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  initialRoomId,
  initialPassphrase,
  initialUserName,
}) => {
  const [roomId, setRoomId] = useState(initialRoomId || 'ruang-rahasia-1');
  const [passphrase, setPassphrase] = useState(initialPassphrase || 'kunci-enkripsi-super-aman');
  const [userName, setUserName] = useState(initialUserName || 'Pengguna');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !passphrase.trim()) return;
    onJoin(roomId.trim(), passphrase.trim(), userName.trim() || 'Anonim');
  };

  const generateRandomRoom = () => {
    const adj = ['rahasia', 'aman', 'senyap', 'terenkripsi', 'perisai', 'kubah'];
    const noun = ['alfa', 'omega', 'delta', 'falcon', 'cipher', 'nexus'];
    const num = Math.floor(100 + Math.random() * 900);
    const randomName = `${adj[Math.floor(Math.random() * adj.length)]}-${
      noun[Math.floor(Math.random() * noun.length)]
    }-${num}`;
    setRoomId(randomName);

    // Also generate secure passphrase
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let randomKey = '';
    for (let i = 0; i < 16; i++) {
      randomKey += charset[Math.floor(Math.random() * charset.length)];
    }
    setPassphrase(randomKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Masuk Ruang Chat Terenkripsi
              </h2>
              <p className="text-xs text-slate-400">
                Kunci sandi tidak pernah dikirim ke server (Zero-Knowledge)
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nama / ID Ruang Sandi</span>
            </label>
            <input
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="contoh: ruang-rahasia-1"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kunci Rahasia Enkripsi (Passphrase E2EE)</span>
            </label>
            <input
              type="text"
              required
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Kunci rahasia bersama lawan bicara"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:border-emerald-500/60 focus:outline-none transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Digunakan oleh browser untuk men-generate kunci AES-256 melalui PBKDF2 (100k iterasi). Lawan bicara harus menggunakan kunci yang sama untuk membaca pesan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nama Samaran Anda</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="contoh: Alice / Agen-07"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500/60 focus:outline-none transition"
            />
          </div>

          {/* Quick random generator */}
          <button
            type="button"
            onClick={generateRandomRoom}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Ruang & Kunci Kripto Acak</span>
          </button>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <span>Buka Saluran Terenkripsi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
