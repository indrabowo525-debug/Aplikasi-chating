import React, { useState } from 'react';
import { Delete, EyeOff, Lock } from 'lucide-react';

interface CamouflageCalculatorProps {
  onUnlock: () => void;
  secretCode: string;
}

export const CamouflageCalculator: React.FC<CamouflageCalculatorProps> = ({
  onUnlock,
  secretCode = '7777',
}) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState('');
  const [inputBuffer, setInputBuffer] = useState('');

  const handleDigit = (digit: string) => {
    setInputBuffer((prev) => prev + digit);

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
      setInputBuffer((prev) => prev + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory('');
    setInputBuffer('');
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
    setInputBuffer((prev) => prev.slice(0, -1));
  };

  const handleOperator = (nextOp: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operation) {
      const currentValue = prevValue || 0;
      const result = calculate(currentValue, inputValue, operation);
      setPrevValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
    setHistory(`${display} ${nextOp}`);
    setInputBuffer('');
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    // Check if entered code matches secret PIN!
    const cleanBuffer = inputBuffer.trim();
    if (cleanBuffer === secretCode || display === secretCode) {
      onUnlock();
      return;
    }

    const inputValue = parseFloat(display);
    if (prevValue !== null && operation) {
      const result = calculate(prevValue, inputValue, operation);
      setHistory(`${history} ${display} =`);
      setDisplay(String(result));
      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
    setInputBuffer('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* App Title in Decoy Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-slate-300">
              Kalkulator Sederhana
            </span>
          </div>
          <button
            onClick={onUnlock}
            title="Keluar dari mode kamuflase"
            className="text-[11px] text-slate-400 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>AegisCrypt</span>
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-950 rounded-2xl p-4 mb-5 border border-slate-800/60 flex flex-col items-end justify-center min-h-[96px]">
          <div className="text-xs text-slate-500 font-mono h-4 mb-1">
            {history}
          </div>
          <div className="text-3xl font-light text-slate-100 font-mono tracking-tight select-all truncate max-w-full">
            {display}
          </div>
        </div>

        {/* Calculator Keypad */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/80 text-rose-400 font-medium text-sm hover:bg-slate-700/80 active:scale-95 transition"
          >
            AC
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/80 text-slate-300 flex items-center justify-center hover:bg-slate-700/80 active:scale-95 transition"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const val = parseFloat(display);
              setDisplay(String(val / 100));
            }}
            className="h-14 rounded-2xl bg-slate-800/80 text-slate-300 font-medium text-sm hover:bg-slate-700/80 active:scale-95 transition"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="h-14 rounded-2xl bg-emerald-600/30 text-emerald-400 font-semibold text-lg hover:bg-emerald-600/40 active:scale-95 transition"
          >
            ÷
          </button>

          <button
            onClick={() => handleDigit('7')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('×')}
            className="h-14 rounded-2xl bg-emerald-600/30 text-emerald-400 font-semibold text-lg hover:bg-emerald-600/40 active:scale-95 transition"
          >
            ×
          </button>

          <button
            onClick={() => handleDigit('4')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('-')}
            className="h-14 rounded-2xl bg-emerald-600/30 text-emerald-400 font-semibold text-lg hover:bg-emerald-600/40 active:scale-95 transition"
          >
            -
          </button>

          <button
            onClick={() => handleDigit('1')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="h-14 rounded-2xl bg-emerald-600/30 text-emerald-400 font-semibold text-lg hover:bg-emerald-600/40 active:scale-95 transition"
          >
            +
          </button>

          <button
            onClick={() => {
              const val = parseFloat(display);
              setDisplay(String(-val));
            }}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-sm font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            ±
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="h-14 rounded-2xl bg-slate-800/50 text-slate-100 text-lg font-medium hover:bg-slate-800 active:scale-95 transition"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-14 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xl hover:bg-emerald-400 active:scale-95 transition shadow-lg shadow-emerald-500/20"
          >
            =
          </button>
        </div>

        {/* Subtle hint */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
          <p className="text-[11px] text-slate-400">
            Mode Rahasia: Masukkan PIN rahasia ({secretCode}) lalu tekan <span className="font-semibold text-slate-300">=</span> untuk membuka chat
          </p>
        </div>
      </div>
    </div>
  );
};
