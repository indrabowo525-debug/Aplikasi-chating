import React, { useState, useEffect, useRef } from 'react';
import { useEncryptedChat } from './hooks/useEncryptedChat';
import { Header } from './components/Header';
import { MessageItem } from './components/MessageItem';
import { MessageInput } from './components/MessageInput';
import { CryptoModal } from './components/CryptoModal';
import { RoomJoinModal } from './components/RoomJoinModal';
import { CamouflageCalculator } from './components/CamouflageCalculator';
import { LockScreen } from './components/LockScreen';
import { SettingsModal } from './components/SettingsModal';
import { DualTestSplitView } from './components/DualTestSplitView';
import { ShareInviteModal } from './components/ShareInviteModal';
import { VideoCallModal } from './components/VideoCallModal';
import {
  TimerOption,
  SecuritySettings,
  CryptoInspectionData,
} from './types/chat';
import {
  ShieldCheck,
  Lock,
  Flame,
  Clock,
  Sparkles,
  ArrowRightLeft,
  KeyRound,
  FileCheck2,
  Video,
  UserPlus,
  PhoneCall,
  PhoneOff,
} from 'lucide-react';
import { playLockSound } from './lib/sound';

const DEFAULT_SETTINGS: SecuritySettings = {
  pin: '1234',
  isPinEnabled: false,
  autoLockOnBlur: false,
  autoLockMinutes: 5,
  soundEnabled: true,
  screenShieldEnabled: false,
  stealthCode: '7777',
};

export default function App() {
  // Check URL query parameters on initial load for 1-click shared links!
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialRoom = urlParams?.get('room') || (typeof localStorage !== 'undefined' ? localStorage.getItem('aegis_room_id') : null) || 'ruang-aman-alpha';
  const initialPass = urlParams?.get('key') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('aegis_passphrase') : null) || 'kunci-sandi-rahasia-2026';
  const initialName = urlParams?.get('name') || (typeof localStorage !== 'undefined' ? localStorage.getItem('aegis_user_name') : null) || 'Agen-Privat';

  // Room credentials
  const [roomId, setRoomId] = useState<string>(initialRoom);
  const [passphrase, setPassphrase] = useState<string>(initialPass);
  const [userId] = useState<string>(() => {
    let id = localStorage.getItem('aegis_user_id');
    if (!id) {
      id = `usr_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('aegis_user_id', id);
    }
    return id;
  });
  const [userName, setUserName] = useState<string>(initialName);

  // Settings
  const [settings, setSettings] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('aegis_security_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Ephemeral Timer selector
  const [activeTimer, setActiveTimer] = useState<TimerOption>(15);

  // Modals and UI States
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCamouflageActive, setIsCamouflageActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [splitViewActive, setSplitViewActive] = useState(false);
  const [inspectionData, setInspectionData] = useState<CryptoInspectionData | null>(null);

  // Scroll ref for chat feed
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Core Encrypted Chat Engine & Video Call Signaling
  const {
    messages,
    participants,
    isConnected,
    isEncrypting,
    sendMessage,
    revealBurnMessage,
    shredMessage,
    purgeRoom,
    safetyNumber,
    fingerprintHex,
    saltHex,
    incomingCall,
    activeCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useEncryptedChat(roomId, passphrase, userId, userName, {
    soundEnabled: settings.soundEnabled,
  });

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save room preferences
  useEffect(() => {
    localStorage.setItem('aegis_room_id', roomId);
    sessionStorage.setItem('aegis_passphrase', passphrase);
    localStorage.setItem('aegis_user_name', userName);
  }, [roomId, passphrase, userName]);

  // Save settings
  const handleUpdateSettings = (newSettings: SecuritySettings) => {
    setSettings(newSettings);
    localStorage.setItem('aegis_security_settings', JSON.stringify(newSettings));
  };

  // Anti-Snoop: Auto-lock on blur
  useEffect(() => {
    const handleBlur = () => {
      if (settings.autoLockOnBlur && settings.isPinEnabled) {
        setIsLocked(true);
        playLockSound(settings.soundEnabled);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [settings.autoLockOnBlur, settings.isPinEnabled, settings.soundEnabled]);

  // Keyboard shortcut: Escape or Alt+C toggles Camouflage Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'c') || (e.key === 'Escape' && !isCamouflageActive)) {
        setIsCamouflageActive(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCamouflageActive]);

  // Handler for joining room
  const handleJoinRoom = (newRoom: string, newPass: string, newName: string) => {
    setRoomId(newRoom);
    setPassphrase(newPass);
    setUserName(newName);
    setShowRoomModal(false);
  };

  // Inspect message cipher details
  const handleInspectCrypto = (data: CryptoInspectionData) => {
    setInspectionData(data);
    setShowCryptoModal(true);
  };

  // Panic button handler
  const handlePanicPurge = () => {
    const confirmed = window.confirm(
      '⚠️ PERINGATAN DARURAT:\nApakah Anda yakin ingin memusnahkan seluruh pesan di ruang ini sekarang juga? Tindakan ini permanen dan tidak dapat dibatalkan.'
    );
    if (confirmed) {
      purgeRoom();
    }
  };

  // Reset all local storage
  const handleResetAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. Camouflage Decoy Screen (Calculator) */}
      {isCamouflageActive && (
        <CamouflageCalculator
          secretCode={settings.stealthCode || '7777'}
          onUnlock={() => setIsCamouflageActive(false)}
        />
      )}

      {/* 2. Security Lock Screen */}
      {isLocked && settings.isPinEnabled && (
        <LockScreen
          correctPin={settings.pin}
          soundEnabled={settings.soundEnabled}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* 3. Floating Incoming Video Call Banner */}
      {incomingCall && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-slate-900/95 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-bounce">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-400 font-semibold">
                  Panggilan Video Masuk (E2EE)
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {incomingCall.callerName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={acceptCall}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Terima</span>
              </button>
              <button
                onClick={rejectCall}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Navigation Header */}
      <Header
        roomId={roomId}
        onChangeRoom={() => setShowRoomModal(true)}
        activePeersCount={participants.length}
        activeTimer={activeTimer}
        onOpenTimerSelect={() => {}}
        onOpenCryptoModal={() => {
          setInspectionData(null);
          setShowCryptoModal(true);
        }}
        onTriggerCamouflage={() => setIsCamouflageActive(true)}
        onPanicPurge={handlePanicPurge}
        onLockApp={() => {
          if (!settings.isPinEnabled) {
            setShowSettingsModal(true);
          } else {
            setIsLocked(true);
            playLockSound(settings.soundEnabled);
          }
        }}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() =>
          handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
        }
        splitViewActive={splitViewActive}
        onToggleSplitView={() => setSplitViewActive(!splitViewActive)}
        currentUserName={userName}
        onStartVideoCall={() => startCall(true)}
        onOpenShareInvite={() => setShowShareModal(true)}
      />

      {/* 5. Body Area: Dual Split View OR Single Standard View */}
      {splitViewActive ? (
        <DualTestSplitView
          roomId={roomId}
          passphrase={passphrase}
          soundEnabled={settings.soundEnabled}
          onClose={() => setSplitViewActive(false)}
          onInspectCrypto={handleInspectCrypto}
        />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden max-w-4xl w-full mx-auto">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            {messages.length === 0 ? (
              /* High-Design Empty State with Zero-Knowledge Encryption Briefing */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  Ruang Obrolan Terenkripsi E2EE Aktif
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Pesan & panggilan dilindungi menggunakan cipher <span className="text-emerald-400 font-mono">AES-256-GCM</span> dan protokol WebRTC <span className="text-emerald-400 font-mono">DTLS-SRTP</span>.
                </p>

                {/* Quick actions: Tautkan Teman & Video Call */}
                <div className="grid grid-cols-2 gap-2 mt-5 w-full text-left text-xs">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tautkan Teman</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Buka Tautan Sekali Klik & QR Code (Tanpa No HP).
                    </div>
                  </button>

                  <button
                    onClick={() => startCall(true)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Call E2EE</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Mulai panggilan video langsung terenkripsi p2p.
                    </div>
                  </button>
                </div>

                {/* Quick Test Split View Trigger */}
                <button
                  onClick={() => setSplitViewActive(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-medium transition"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buka Mode Uji 2 Sisi (Simulasi Alice & Bob)</span>
                </button>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentUserId={userId}
                  onRevealBurn={revealBurnMessage}
                  onShredMessage={shredMessage}
                  onInspectCrypto={handleInspectCrypto}
                  screenShieldEnabled={settings.screenShieldEnabled}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <MessageInput
            onSendMessage={sendMessage}
            currentTimer={activeTimer}
            onSetTimer={setActiveTimer}
            isEncrypting={isEncrypting}
          />
        </div>
      )}

      {/* 6. Active Video Call Modal */}
      {activeCall && (
        <VideoCallModal
          isOpen={true}
          onClose={endCall}
          callerName={activeCall.peerName}
          isIncoming={false}
          roomId={roomId}
          currentUserName={userName}
          soundEnabled={settings.soundEnabled}
        />
      )}

      {/* 7. Cryptography Verification Modal */}
      <CryptoModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        safetyNumber={safetyNumber}
        fingerprintHex={fingerprintHex}
        passphrase={passphrase}
        saltHex={saltHex}
        inspectionMessage={inspectionData}
      />

      {/* 8. Room Credentials & Passphrase Modal */}
      <RoomJoinModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        onJoin={handleJoinRoom}
        initialRoomId={roomId}
        initialPassphrase={passphrase}
        initialUserName={userName}
      />

      {/* 9. Share Invite Modal (Tautkan Teman - Tanpa No HP) */}
      <ShareInviteModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        roomId={roomId}
        passphrase={passphrase}
      />

      {/* 10. Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetAllData={handleResetAllData}
      />
    </div>
  );
}
