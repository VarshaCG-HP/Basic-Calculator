import React from 'react';
import { Trash2, History, RotateCcw, Calendar } from 'lucide-react';
import { HistoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClearAll: () => void;
  onRemoveItem: (id: string) => void;
}

export default function HistoryPanel({
  history,
  onSelect,
  onClearAll,
  onRemoveItem,
}: HistoryPanelProps) {
  const formatTime = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300 shadow-xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <h3 id="history-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Calculation History
        </h3>
        {history.length > 0 && (
          <button
            id="clear-all-history"
            onClick={onClearAll}
            className="text-[10px] text-indigo-400 font-bold uppercase hover:text-indigo-300 cursor-pointer transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[340px] lg:max-h-[460px] scrollbar-thin">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <History className="w-10 h-10 mb-2 opacity-20 text-indigo-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">No calculations yet</p>
            <p className="text-[11px] text-slate-600 mt-1">Your calculations will appear here</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="group relative flex flex-col items-end gap-1.5 border-b border-slate-800 pb-4 last:border-0 hover:bg-slate-800/10 p-2 rounded transition-colors duration-150"
              >
                {/* Delete button positioned to left */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all duration-150 cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] text-slate-500 font-mono italic">
                  {formatTime(item.timestamp)}
                </span>
                
                <span className="text-xs text-slate-400 font-mono break-all text-right max-w-full">
                  {item.formula}
                </span>

                <span className="text-md font-mono text-indigo-300 font-medium">
                  = {item.result}
                </span>

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onSelect(item)}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors duration-150 cursor-pointer uppercase tracking-wider"
                    title="Restore to calculator"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Restore
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <footer className="mt-6 p-4 bg-slate-800/30 rounded border border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-500">
          <span>Session Log</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-indigo-500"></div>
        </div>
      </footer>
    </div>
  );
}
