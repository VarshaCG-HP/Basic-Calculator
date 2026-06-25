import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calculator, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Info, 
  Sparkles,
  HelpCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem, CalculatorState, ButtonConfig, CalculatorOperator } from './types';
import HistoryPanel from './components/HistoryPanel';
import CalculatorKeypad from './components/CalculatorKeypad';

// Synthetic Web Audio tactility synthesizer
const playClickSound = (type: 'key' | 'eval' | 'clear' | 'error', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'key') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'eval') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'clear') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch (e) {
    // Audio Context might be blocked or unsupported until active interaction
  }
};

export default function App() {
  // State Initialization
  const [state, setState] = useState<CalculatorState>({
    displayValue: '0',
    formula: '',
    previousValue: null,
    currentOperator: null,
    isNewInput: true,
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('calculator_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('calculator_muted');
    return saved === 'true';
  });

  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('calculator_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('calculator_muted', String(isMuted));
  }, [isMuted]);

  // Math Helper Functions
  const getOperatorSymbol = (op: CalculatorOperator): string => {
    switch (op) {
      case 'add': return '+';
      case 'subtract': return '−';
      case 'multiply': return '×';
      case 'divide': return '÷';
      default: return '';
    }
  };

  const formatNumberForFormula = (num: number | string): string => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    if (n < 0) return `(${n})`;
    return n.toString();
  };

  const formatResult = (num: number): string => {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Error';
    
    // Max precision to avoid binary floating point issues (e.g. 0.1 + 0.2)
    const precision = 12;
    const formatted = Number(num.toFixed(precision)).toString();
    
    if (formatted.length > 15) {
      return num.toExponential(8);
    }
    return formatted;
  };

  const evaluate = (v1: number, v2: number, op: CalculatorOperator): number => {
    switch (op) {
      case 'add': return v1 + v2;
      case 'subtract': return v1 - v2;
      case 'multiply': return v1 * v2;
      case 'divide':
        if (v2 === 0) return Infinity;
        return v1 / v2;
      default: return v2;
    }
  };

  // Keyboard shortcut or Click action dispatch
  const handleAction = useCallback((value: string, type: ButtonConfig['type']) => {
    setState((prev) => {
      let nextDisplay = prev.displayValue;
      let nextFormula = prev.formula;
      let nextPrevValue = prev.previousValue;
      let nextOperator = prev.currentOperator;
      let nextIsNewInput = prev.isNewInput;

      if (type === 'digit') {
        if (value === '.') {
          if (nextIsNewInput) {
            nextDisplay = '0.';
            nextIsNewInput = false;
          } else if (!nextDisplay.includes('.')) {
            nextDisplay += '.';
          }
        } else {
          if (nextIsNewInput) {
            nextDisplay = value;
            nextIsNewInput = false;
          } else {
            nextDisplay = nextDisplay === '0' ? value : nextDisplay + value;
          }
        }
        playClickSound('key', isMuted);
      } 
      
      else if (type === 'action') {
        if (value === 'AC') {
          nextDisplay = '0';
          nextFormula = '';
          nextPrevValue = null;
          nextOperator = null;
          nextIsNewInput = true;
          playClickSound('clear', isMuted);
        } 
        
        else if (value === '+/-') {
          if (nextDisplay !== '0' && nextDisplay !== 'Error') {
            if (nextDisplay.startsWith('-')) {
              nextDisplay = nextDisplay.slice(1);
            } else {
              nextDisplay = '-' + nextDisplay;
            }
            playClickSound('key', isMuted);
          } else {
            playClickSound('error', isMuted);
          }
        } 
        
        else if (value === '%') {
          const num = parseFloat(nextDisplay);
          if (!isNaN(num) && nextDisplay !== 'Error') {
            nextDisplay = formatResult(num / 100);
            nextIsNewInput = true;
            playClickSound('key', isMuted);
          } else {
            playClickSound('error', isMuted);
          }
        } 
        
        else if (value === 'Backspace') {
          if (nextIsNewInput || nextDisplay === 'Error' || nextDisplay === '0') {
            playClickSound('error', isMuted);
          } else {
            if (nextDisplay.length > 1) {
              nextDisplay = nextDisplay.slice(0, -1);
              if (nextDisplay === '-') nextDisplay = '0';
            } else {
              nextDisplay = '0';
            }
            playClickSound('key', isMuted);
          }
        }
      } 
      
      else if (type === 'operator') {
        const currentNum = parseFloat(nextDisplay);
        const opSymbol = getOperatorSymbol(value as CalculatorOperator);

        if (nextDisplay === 'Error') {
          playClickSound('error', isMuted);
          return prev;
        }

        if (nextPrevValue === null) {
          nextPrevValue = currentNum;
          nextFormula = `${formatNumberForFormula(currentNum)} ${opSymbol}`;
        } else if (nextOperator !== null && !nextIsNewInput) {
          // Compute sequential value
          const result = evaluate(nextPrevValue, currentNum, nextOperator);
          if (result === Infinity || isNaN(result)) {
            nextDisplay = 'Error';
            nextPrevValue = null;
            nextOperator = null;
            nextFormula = '';
            nextIsNewInput = true;
            playClickSound('error', isMuted);
            return {
              displayValue: 'Error',
              formula: '',
              previousValue: null,
              currentOperator: null,
              isNewInput: true,
            };
          }
          const formatted = formatResult(result);
          nextDisplay = formatted;
          nextPrevValue = result;
          nextFormula = `${formatNumberForFormula(result)} ${opSymbol}`;
        } else if (nextOperator !== null && nextIsNewInput) {
          // Switch operator
          nextFormula = nextFormula.slice(0, -1).trim() + ` ${opSymbol}`;
        }

        nextOperator = value as CalculatorOperator;
        nextIsNewInput = true;
        playClickSound('key', isMuted);
      } 
      
      else if (type === 'equals') {
        if (nextPrevValue !== null && nextOperator !== null) {
          const currentNum = parseFloat(nextDisplay);
          
          if (nextDisplay === 'Error' || isNaN(currentNum)) {
            playClickSound('error', isMuted);
            return prev;
          }

          const result = evaluate(nextPrevValue, currentNum, nextOperator);
          const formattedResult = formatResult(result);
          const opSymbol = getOperatorSymbol(nextOperator);
          const finalFormula = `${formatNumberForFormula(nextPrevValue)} ${opSymbol} ${formatNumberForFormula(currentNum)}`;

          if (formattedResult === 'Error') {
            nextDisplay = 'Error';
            nextFormula = '';
            nextPrevValue = null;
            nextOperator = null;
            nextIsNewInput = true;
            playClickSound('error', isMuted);
          } else {
            // Save to client calculation history
            const newHistoryItem: HistoryItem = {
              id: Math.random().toString(36).substr(2, 9),
              formula: finalFormula,
              result: formattedResult,
              timestamp: new Date(),
            };
            setHistory((old) => [newHistoryItem, ...old]);

            nextDisplay = formattedResult;
            nextFormula = `${finalFormula} =`;
            nextPrevValue = null;
            nextOperator = null;
            nextIsNewInput = true;
            playClickSound('eval', isMuted);
          }
        } else {
          playClickSound('error', isMuted);
        }
      }

      return {
        displayValue: nextDisplay,
        formula: nextFormula,
        previousValue: nextPrevValue,
        currentOperator: nextOperator,
        isNewInput: nextIsNewInput,
      };
    });
  }, [isMuted]);

  // Window keydown listener for keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when shortcuts would conflict with text inputs (if any existed, but none do)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleAction(key, 'digit');
      } else if (key === '.') {
        e.preventDefault();
        handleAction('.', 'digit');
      } else if (key === '+') {
        e.preventDefault();
        handleAction('add', 'operator');
      } else if (key === '-') {
        e.preventDefault();
        handleAction('subtract', 'operator');
      } else if (key === '*' || key.toLowerCase() === 'x') {
        e.preventDefault();
        handleAction('multiply', 'operator');
      } else if (key === '/') {
        e.preventDefault();
        handleAction('divide', 'operator');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleAction('=', 'equals');
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleAction('Backspace', 'action');
      } else if (key === 'Escape') {
        e.preventDefault();
        handleAction('AC', 'action');
      } else if (key === '%') {
        e.preventDefault();
        handleAction('%', 'action');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAction]);

  // History callback triggers
  const handleSelectHistory = (item: HistoryItem) => {
    setState({
      displayValue: item.result,
      formula: `${item.formula} =`,
      previousValue: null,
      currentOperator: null,
      isNewInput: true,
    });
    playClickSound('eval', isMuted);
  };

  const handleClearHistory = () => {
    setHistory([]);
    playClickSound('clear', isMuted);
  };

  const handleRemoveHistoryItem = (id: string) => {
    setHistory((old) => old.filter((item) => item.id !== id));
    playClickSound('clear', isMuted);
  };

  // Dynamic font size computation for display to prevent layout breaking
  const getDisplayFontSize = (textLength: number) => {
    if (textLength > 12) return 'text-xl sm:text-2xl';
    if (textLength > 8) return 'text-2xl sm:text-3xl';
    return 'text-4xl sm:text-5xl';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative subtle ambient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-amber-500 to-indigo-500 opacity-60 z-20" />

      {/* Header Panel */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-8 bg-slate-900/50 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center font-bold text-lg text-white">
            +
          </div>
          <div>
            <h1 className="text-sm sm:text-xl font-medium tracking-tight uppercase">
              Precision Calc <span className="text-indigo-400 font-bold">PRO</span>
            </h1>
          </div>
        </div>

        {/* Mode Indicators hidden on very small screens, visible on larger */}
        <div className="hidden md:flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="text-indigo-400 border-b-2 border-indigo-400 pb-1">Standard</span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">Scientific</span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">Graphing</span>
          <span className="hover:text-slate-300 transition-colors cursor-pointer">Converter</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sounds Toggle */}
          <button
            id="sound-toggle"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${
              isMuted 
                ? 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-400' 
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
            }`}
            title={isMuted ? "Enable sound click" : "Mute click sound"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>

          {/* Keyboard Guide Toggle */}
          <button
            id="keyboard-guide"
            onClick={() => setShowGuide(true)}
            className="p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 transition-all duration-150 cursor-pointer"
            title="Keyboard shortcuts guide"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto flex flex-col justify-center items-center z-10 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
          
          {/* Section 1: Tactile Pocket Calculator Unit */}
          <section className="lg:col-span-7 flex flex-col justify-center items-center">
            <div className="w-full max-w-md bg-slate-900 shadow-2xl rounded-lg overflow-hidden border border-slate-700 relative">
              
              {/* Active operator indicator strip */}
              {state.currentOperator && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500 z-10 animate-pulse" />
              )}

              {/* Display View Screen */}
              <div className="p-8 bg-slate-800/30 flex flex-col items-end justify-center h-36 border-b border-slate-800 relative group">
                
                {/* Active operator glowing indicator */}
                {state.currentOperator && (
                  <div className="absolute left-6 top-6 text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shadow-sm">
                    {getOperatorSymbol(state.currentOperator)} ACTIVE
                  </div>
                )}

                {/* Sub-display for continuous math formula */}
                <div className="text-right text-slate-500 text-sm font-mono tracking-tighter select-none overflow-hidden text-ellipsis whitespace-nowrap w-full">
                  {state.formula || <span className="opacity-0">0</span>}
                </div>

                {/* Main numeric digital value display */}
                <div className="text-right mt-1 w-full overflow-x-auto select-all scrollbar-none">
                  <span 
                    className={`font-mono font-light text-white tracking-tighter leading-none transition-all duration-150 ${getDisplayFontSize(state.displayValue.length)}`}
                  >
                    {state.displayValue}
                  </span>
                </div>
              </div>

              {/* Tactile Keypad */}
              <div className="p-0">
                <CalculatorKeypad 
                  onKeyPress={handleAction} 
                  activeOperator={state.currentOperator} 
                />
              </div>

            </div>
          </section>

          {/* Section 2: Calculation History Log */}
          <section className="lg:col-span-5 flex flex-col justify-center">
            <HistoryPanel
              history={history}
              onSelect={handleSelectHistory}
              onClearAll={handleClearHistory}
              onRemoveItem={handleRemoveHistoryItem}
            />
          </section>

        </div>
      </main>

      {/* Footer copyright and metadata */}
      <footer className="h-14 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between px-8 text-[11px] text-slate-600 gap-2 z-10 bg-slate-950/40">
        <p className="font-medium">
          Precision Geometric Engine &copy; {new Date().getFullYear()}
        </p>
        <div className="flex items-center gap-4 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LocalStorage Persistent
          </span>
        </div>
      </footer>

      {/* Interactive Keyboard shortcut overlay guide modal */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-semibold text-slate-200">
                  Keyboard Shortcuts
                </h3>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Numbers</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    0 - 9
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Decimal Point</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    .
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Operators</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    + , - , * , /
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Evaluate (=)</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    Enter
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Backspace</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    Backspace
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Clear All (AC)</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    Esc
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400">Percentage</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shadow-sm font-semibold">
                    %
                  </kbd>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="mt-6 w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold tracking-wide uppercase cursor-pointer transition-colors"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
