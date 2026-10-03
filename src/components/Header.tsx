import React from 'react';
import {
  ShieldCheck,
  Calculator,
  Flame,
  Key,
  Lock,
  Volume2,
  VolumeX,
  Users,
  Eye,
  Columns,
  RefreshCw,
  Video,
  UserPlus,
} from 'lucide-react';
import { TimerOption } from '../types/chat';

interface HeaderProps {
  roomId: string;
  onChangeRoom: () => void;
  activePeersCount: number;
  activeTimer: TimerOption;
  onOpenTimerSelect: () => void;
  onOpenCryptoModal: () => void;
  onTriggerCamouflage: () => void;
  onPanicPurge: () => void;
  onLockApp: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  splitViewActive: boolean;
  onToggleSplitView: () => void;
  currentUserName: string;
  onStartVideoCall: () => void;
  onOpenShareInvite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  onChangeRoom,
  activePeersCount,
  activeTimer,
  onOpenTimerSelect,
  onOpenCryptoModal,
  onTriggerCamouflage,
  onPanicPurge,
  onLockApp,
  soundEnabled,
  onToggleSound,
  splitViewActive,
  onToggleSplitView,
  currentUserName,
  onStartVideoCall,
  onOpenShareInvite,
}) => {
  const getTimerLabel = (timer: TimerOption) => {
    if (timer === 0) return 'Timer: Mati';
    if (timer === -1) return '🔥 Sekali Buka';
    if (timer < 60) return `⏱️ ${timer}s`;
    if (timer < 3600) return `⏱️ ${timer / 60}m`;
    return `⏱️ ${timer / 3600}h`;
  };

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark with icon */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
            AegisCrypt
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </span>
        </div>

        {/* Room switch tag */}
        <button
          onClick={onChangeRoom}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md transition-colors flex items-center gap-1.5"
          title="Ganti Ruang Sandi"
        >
          <span className="font-mono text-emerald-400 font-medium">#{roomId}</span>
          <RefreshCw className="w-2.5 h-2.5 text-slate-500" />
        </button>
      </div>

      {/* Zone 2: Clean unboxed metadata and quick settings */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-medium">{activePeersCount} Terhubung</span>
        </div>

        <span aria-hidden="true" className="text-slate-700">·</span>

        <button
          onClick={onOpenTimerSelect}
          className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
          title="Ubah Waktu Otomatis Terhapus"
        >
          <span>{getTimerLabel(activeTimer)}</span>
        </button>

        <span aria-hidden="true" className="text-slate-700">·</span>

        <button
          onClick={onOpenCryptoModal}
          className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1"
          title="Verifikasi Nomor Keamanan Kriptografi"
        >
          <Key className="w-3.5 h-3.5 text-emerald-400" />
          <span>E2EE 256-Bit</span>
        </button>

        <span aria-hidden="true" className="text-slate-700">·</span>

        <span className="text-slate-400">
          User: <span className="text-slate-200 font-medium">{currentUserName}</span>
        </span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Video Call Trigger */}
        <button
          onClick={onStartVideoCall}
          className="h-9 px-2.5 sm:px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Mulai Panggilan Video Terenkripsi (WebRTC DTLS-SRTP)"
        >
          <Video className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Panggilan</span>
        </button>

        {/* Tautkan Teman (Share Invite) */}
        <button
          onClick={onOpenShareInvite}
          className="h-9 px-2.5 sm:px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Tautkan Teman (Tautan Sekali Klik, QR, atau Kredensial - Tanpa Nomor HP)"
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Tautkan Teman</span>
        </button>

        {/* Toggle Split-Screen Dual Simulator */}
        <button
          onClick={onToggleSplitView}
          className={`h-9 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
            splitViewActive
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Simulasi 2 Sisi: Uji Coba Alice & Bob Berdampingan"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Uji 2 Sisi</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Camouflage / Decoy Mode (Kalkulator Rahasia) */}
        <button
          onClick={onTriggerCamouflage}
          className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Sembunyikan Layar (Mode Kamuflase Kalkulator)"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Kamuflase</span>
        </button>

        {/* Panic Wipe Button */}
        <button
          onClick={onPanicPurge}
          className="h-9 px-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 hover:bg-rose-900/50 hover:text-rose-100 flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Musnahkan Semua Pesan Seketika (Panic Wipe)"
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Pemusnahan</span>
        </button>

        {/* Lock Screen */}
        <button
          onClick={onLockApp}
          className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
          title="Kunci Aplikasi"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
