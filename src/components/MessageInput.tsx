import React, { useState, useRef } from 'react';
import {
  Send,
  Flame,
  Clock,
  Image,
  Paperclip,
  Lock,
  ChevronDown,
  X,
} from 'lucide-react';
import { TimerOption } from '../types/chat';

interface MessageInputProps {
  onSendMessage: (
    content: string,
    timerSeconds: number,
    isBurnAfterReading: boolean,
    mediaType?: 'text' | 'image'
  ) => void;
  currentTimer: TimerOption;
  onSetTimer: (timer: TimerOption) => void;
  isEncrypting: boolean;
}

const TIMER_PRESETS: { label: string; value: TimerOption; desc: string }[] = [
  { label: 'Timer Mati', value: 0, desc: 'Pesan tersimpan di ruang obrolan' },
  { label: '🔥 Sekali Buka (Burn)', value: -1, desc: 'Musnah 10s setelah penerima membuka' },
  { label: '⏱️ 5 Detik', value: 5, desc: 'Sangat rahasia & cepat musnah' },
  { label: '⏱️ 15 Detik', value: 15, desc: 'Musnah 15 detik setelah terkirim' },
  { label: '⏱️ 30 Detik', value: 30, desc: 'Musnah 30 detik setelah terkirim' },
  { label: '⏱️ 1 Menit', value: 60, desc: 'Musnah 1 menit' },
  { label: '⏱️ 5 Menit', value: 300, desc: 'Musnah 5 menit' },
  { label: '⏱️ 1 Jam', value: 3600, desc: 'Musnah 1 jam' },
  { label: '⏱️ 24 Jam', value: 86400, desc: 'Musnah 1 hari' },
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  currentTimer,
  onSetTimer,
  isEncrypting,
}) => {
  const [text, setText] = useState('');
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (selectedImage) {
      const isBurn = currentTimer === -1;
      const seconds = isBurn ? 0 : currentTimer;
      onSendMessage(selectedImage, seconds, isBurn, 'image');
      setSelectedImage(null);
      return;
    }

    if (!text.trim() || isEncrypting) return;

    const isBurn = currentTimer === -1;
    const seconds = isBurn ? 0 : currentTimer;
    onSendMessage(text.trim(), seconds, isBurn, 'text');
    setText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-adjust height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 3MB for encrypted client payload
    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 3MB untuk enkripsi langsung.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSelectedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const currentPreset = TIMER_PRESETS.find((p) => p.value === currentTimer) || TIMER_PRESETS[0];

  return (
    <div className="relative border-t border-slate-800 bg-slate-950/90 backdrop-blur-md p-3 sm:p-4">
      {/* Timer Selection Popover */}
      {showTimerPicker && (
        <div className="absolute bottom-full left-4 mb-2 z-40 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <span>Privasi Pesan Otomatis Terhapus</span>
            <button
              onClick={() => setShowTimerPicker(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto space-y-0.5">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  onSetTimer(preset.value);
                  setShowTimerPicker(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition-colors ${
                  currentTimer === preset.value
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>{preset.label}</span>
                  {currentTimer === preset.value && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Image Preview before sending */}
      {selectedImage && (
        <div className="mb-3 p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedImage}
              alt="Preview lampiran"
              className="w-12 h-12 rounded-lg object-cover border border-slate-700"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Foto Siap Dienkripsi</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Akan dienkripsi AES-256 sebelum transmisi</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Ephemeral Timer Selector Pill */}
        <button
          onClick={() => setShowTimerPicker(!showTimerPicker)}
          className={`h-11 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 ${
            currentTimer === -1
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : currentTimer > 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Atur Waktu Pesan Terhapus"
        >
          {currentTimer === -1 ? (
            <Flame className="w-4 h-4 text-amber-400" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {currentTimer === 0 ? 'Timer' : currentTimer === -1 ? 'Burn' : `${currentTimer}s`}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {/* Image upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center shrink-0 transition-colors"
          title="Kirim Foto Terenkripsi E2EE"
        >
          <Image className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center focus-within:border-emerald-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              currentTimer === -1
                ? 'Ketik pesan rahasia (Burn After Reading)...'
                : currentTimer > 0
                ? `Ketik pesan (otomatis musnah dalam ${currentTimer}s)...`
                : 'Ketik pesan pribadi aman (E2EE terproteksi)...'
            }
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none resize-none max-h-28"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !selectedImage) || isEncrypting}
          className={`h-11 px-4 rounded-xl flex items-center justify-center gap-1.5 font-medium text-xs transition-all shrink-0 ${
            (text.trim() || selectedImage) && !isEncrypting
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Enkripsi & Kirim"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kirim</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Security Banner Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
        <span className="flex items-center gap-1">
          <Lock className="w-2.5 h-2.5 text-emerald-500" />
          <span>Terenkripsi ujung-ke-ujung (AES-256-GCM)</span>
        </span>
        <span className="hidden sm:inline">Tekan Enter untuk kirim, Shift+Enter untuk baris baru</span>
      </div>
    </div>
  );
};
