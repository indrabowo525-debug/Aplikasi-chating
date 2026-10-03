import React, { useState } from 'react';
import { useEncryptedChat } from '../hooks/useEncryptedChat';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { VideoCallModal } from './VideoCallModal';
import { TimerOption, CryptoInspectionData } from '../types/chat';
import { Lock, ArrowLeftRight, Flame, Shield, X, Sparkles, Send, RefreshCw, Video } from 'lucide-react';

interface DualTestSplitViewProps {
  roomId: string;
  passphrase: string;
  soundEnabled: boolean;
  onClose: () => void;
  onInspectCrypto: (data: CryptoInspectionData) => void;
}

export const DualTestSplitView: React.FC<DualTestSplitViewProps> = ({
  roomId,
  passphrase,
  soundEnabled,
  onClose,
  onInspectCrypto,
}) => {
  const [aliceTimer, setAliceTimer] = useState<TimerOption>(5);
  const [bobTimer, setBobTimer] = useState<TimerOption>(-1);

  // Instance 1: Alice (connects to roomId with passphrase)
  const alice = useEncryptedChat(
    roomId,
    passphrase,
    'user_alice_demo',
    'Alice',
    { soundEnabled }
  );

  // Instance 2: Bob (connects to roomId with passphrase)
  const bob = useEncryptedChat(
    roomId,
    passphrase,
    'user_bob_demo',
    'Bob',
    { soundEnabled }
  );

  const sendQuickSampleToBob = (seconds = 5) => {
    alice.sendMessage(
      `Hai Bob! Pesan ini dienkripsi dengan AES-256-GCM dan otomatis musnah dalam ${seconds} detik!`,
      seconds,
      false,
      'text'
    );
  };

  const sendBurnSampleToAlice = () => {
    bob.sendMessage(
      'Kunci brankas rahasia: #9942-ALPHA-Z. Pesan ini sekali buka (Burn after reading)!',
      0,
      true,
      'text'
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Banner Guide for Split Testing */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span>Mode Uji Coba Berdampingan (Simulasi 2 Sisi: Alice & Bob)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                Ruang: #{roomId}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Kunci AES-256 diturunkan secara identik dari passphrase & ruang. Anda dapat mengirim pesan dari sisi kiri ke kanan secara real-time.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alice.startCall(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-medium transition"
            title="Uji Panggilan Video Alice ke Bob"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tes Video Call</span>
          </button>

          <button
            onClick={() => sendQuickSampleToBob(5)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 text-xs font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kirim Tes 5 Detik</span>
          </button>

          <button
            onClick={sendBurnSampleToAlice}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 text-xs font-medium transition"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Kirim Tes Burn</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Tutup Mode 2 Sisi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split Screens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 flex-1 overflow-hidden min-h-0">
        {/* Left Side: Alice */}
        <div className="flex flex-col h-full overflow-hidden bg-slate-950/60">
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-400">Sisi Pengguna: Alice</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Fingerprint: #{alice.fingerprintHex.substring(0, 8)}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {alice.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <Lock className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs">Belum ada pesan di sisi Alice.</p>
                <button
                  onClick={() => sendQuickSampleToBob(5)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/30 transition flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Pesan Otomatis Terhapus (5s)</span>
                </button>
              </div>
            ) : (
              alice.messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentUserId="user_alice_demo"
                  onRevealBurn={alice.revealBurnMessage}
                  onShredMessage={alice.shredMessage}
                  onInspectCrypto={onInspectCrypto}
                  screenShieldEnabled={false}
                />
              ))
            )}
          </div>

          {/* Quick interactive test chips */}
          <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 shrink-0">Tes Cepat:</span>
            <button
              onClick={() => sendQuickSampleToBob(5)}
              className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/60 shrink-0 transition"
            >
              ⏱️ Kirim 5s
            </button>
            <button
              onClick={() => alice.sendMessage('Rahasia tingkat tinggi! Pesan ini sekali buka.', 0, true, 'text')}
              className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 hover:bg-amber-900/60 shrink-0 transition"
            >
              🔥 Sekali Buka
            </button>
          </div>

          {/* Alice Input */}
          <MessageInput
            onSendMessage={alice.sendMessage}
            currentTimer={aliceTimer}
            onSetTimer={setAliceTimer}
            isEncrypting={alice.isEncrypting}
          />
        </div>

        {/* Right Side: Bob */}
        <div className="flex flex-col h-full overflow-hidden bg-slate-950/60">
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></div>
              <span className="text-xs font-bold text-sky-400">Sisi Pengguna: Bob</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Fingerprint: #{bob.fingerprintHex.substring(0, 8)}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {bob.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <Lock className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs">Belum ada pesan di sisi Bob.</p>
                <button
                  onClick={sendBurnSampleToAlice}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs hover:bg-sky-500/30 transition flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Pesan Burn ke Alice</span>
                </button>
              </div>
            ) : (
              bob.messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentUserId="user_bob_demo"
                  onRevealBurn={bob.revealBurnMessage}
                  onShredMessage={bob.shredMessage}
                  onInspectCrypto={onInspectCrypto}
                  screenShieldEnabled={false}
                />
              ))
            )}
          </div>

          {/* Quick interactive test chips */}
          <div className="px-3 py-1.5 bg-slate-900/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 shrink-0">Tes Cepat:</span>
            <button
              onClick={() => bob.sendMessage('Halo Alice! Pesanmu terbaca jelas dan aman!', 15, false, 'text')}
              className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/40 text-sky-300 hover:bg-sky-900/60 shrink-0 transition"
            >
              Balas Alice (15s)
            </button>
            <button
              onClick={sendBurnSampleToAlice}
              className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 hover:bg-amber-900/60 shrink-0 transition"
            >
              🔥 Kirim Burn
            </button>
          </div>

          {/* Bob Input */}
          <MessageInput
            onSendMessage={bob.sendMessage}
            currentTimer={bobTimer}
            onSetTimer={setBobTimer}
            isEncrypting={bob.isEncrypting}
          />
        </div>
      </div>

      {/* Video Call Modal for Alice / Bob Test */}
      {(alice.activeCall || bob.activeCall || bob.incomingCall || alice.incomingCall) && (
        <VideoCallModal
          isOpen={true}
          onClose={() => {
            alice.endCall();
            bob.endCall();
          }}
          callerName={
            bob.incomingCall ? 'Alice' : alice.incomingCall ? 'Bob' : 'Teman Obrolan'
          }
          isIncoming={!!(bob.incomingCall || alice.incomingCall)}
          onAccept={() => {
            if (bob.incomingCall) bob.acceptCall();
            if (alice.incomingCall) alice.acceptCall();
          }}
          onReject={() => {
            if (bob.incomingCall) bob.rejectCall();
            if (alice.incomingCall) alice.rejectCall();
          }}
          roomId={roomId}
          currentUserName={bob.incomingCall ? 'Bob' : 'Alice'}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
};
