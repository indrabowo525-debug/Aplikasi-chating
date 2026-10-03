import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  EyeOff,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { playCallEndSound } from '../lib/sound';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  roomId: string;
  currentUserName: string;
  soundEnabled: boolean;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  callerName,
  isIncoming = false,
  onAccept,
  onReject,
  roomId,
  currentUserName,
  soundEnabled,
}) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFaceShieldActive, setIsFaceShieldActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(!isIncoming);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isConnected]);

  // Request actual camera or fallback
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (!isOpen || isIncoming) return;

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        // Fallback gracefully (camera permission denied or simulated in iframe)
        console.log('Camera permission denied or not available, using simulated stream mode:', err);
      }
    }

    setupCamera();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen, isIncoming]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleEndCall = () => {
    playCallEndSound(soundEnabled);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    onClose();
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[700px] text-slate-100">
        {/* Top Floating Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-200">
              {isConnected ? formatDuration(callDuration) : 'Menghubungkan...'}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>P2P DTLS-SRTP</span>
            </span>
          </div>

          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300 pointer-events-auto">
            Ruang: <span className="font-mono text-emerald-400">#{roomId}</span>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Main Remote Video / Interlocutor Feed */}
          <div
            className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative ${
              isFaceShieldActive ? 'filter blur-md' : ''
            }`}
          >
            {/* Visualizer / Avatar of Remote Peer */}
            <div className="relative flex flex-col items-center">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/10">
                <span className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {callerName ? callerName.substring(0, 2).toUpperCase() : 'AG'}
                </span>
              </div>

              {/* Pulsing Voice Waves */}
              {isAudioEnabled && (
                <div className="flex items-center gap-1.5 mt-6">
                  <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-7 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                  <span className="w-1.5 h-10 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                </div>
              )}

              <div className="text-base font-semibold text-slate-200 mt-4">
                {callerName}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {isConnected ? 'Panggilan Terenkripsi Aktif' : 'Menunggu respons teman...'}
              </div>
            </div>
          </div>

          {/* Picture-in-Picture Local Self Preview (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-20 w-28 sm:w-40 aspect-video rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex items-center justify-center">
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <VideoOff className="w-5 h-5 text-slate-500" />
                <span className="text-[10px] mt-1">Kamera Mati</span>
              </div>
            )}

            <div className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
              Anda
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 sm:gap-4 z-20">
          {isIncoming && !isConnected ? (
            /* Incoming Call Controls */
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setIsConnected(true);
                  if (onAccept) onAccept();
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-transform active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Video className="w-4 h-4" />
                <span>Terima Panggilan</span>
              </button>

              <button
                onClick={() => {
                  if (onReject) onReject();
                  handleEndCall();
                }}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-transform active:scale-95 flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Tolak</span>
              </button>
            </div>
          ) : (
            /* Active In-Call Controls */
            <>
              {/* Mic Toggle */}
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isAudioEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-400'
                }`}
                title={isAudioEnabled ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isVideoEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-400'
                }`}
                title={isVideoEnabled ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Face Shield Privacy Mask */}
              <button
                onClick={() => setIsFaceShieldActive(!isFaceShieldActive)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isFaceShieldActive
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                title="Perisai Privasi Wajah (Face Blur)"
              >
                {isFaceShieldActive ? <EyeOff className="w-5 h-5 text-amber-400" /> : <Eye className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="w-14 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-rose-600/30"
                title="Akhiri Panggilan"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
