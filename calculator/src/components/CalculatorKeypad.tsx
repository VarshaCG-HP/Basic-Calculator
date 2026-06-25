import React from 'react';
import { Delete, Percent, CircleDot } from 'lucide-react';
import { ButtonConfig, CalculatorOperator } from '../types';
import { motion } from 'motion/react';

interface CalculatorKeypadProps {
  onKeyPress: (value: string, type: ButtonConfig['type']) => void;
  activeOperator: CalculatorOperator;
}

export default function CalculatorKeypad({ onKeyPress, activeOperator }: CalculatorKeypadProps) {
  // Ordered layout grid for the pocket calculator
  const buttons: ButtonConfig[] = [
    // Row 1
    { label: 'AC', type: 'action', value: 'AC', colorClass: 'bg-slate-800 text-indigo-400 font-bold hover:bg-slate-700/80' },
    { label: '±', type: 'action', value: '+/-', colorClass: 'bg-slate-800 text-indigo-400 font-bold hover:bg-slate-700/80' },
    { label: '%', type: 'action', value: '%', colorClass: 'bg-slate-800 text-indigo-400 font-bold hover:bg-slate-700/80' },
    { label: '÷', type: 'operator', value: 'divide', colorClass: 'bg-amber-600 text-white font-bold hover:bg-amber-500' },
    
    // Row 2
    { label: '7', type: 'digit', value: '7', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '8', type: 'digit', value: '8', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '9', type: 'digit', value: '9', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '×', type: 'operator', value: 'multiply', colorClass: 'bg-amber-600 text-white font-bold hover:bg-amber-500' },
    
    // Row 3
    { label: '4', type: 'digit', value: '4', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '5', type: 'digit', value: '5', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '6', type: 'digit', value: '6', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '−', type: 'operator', value: 'subtract', colorClass: 'bg-amber-600 text-white font-bold hover:bg-amber-500' },
    
    // Row 4
    { label: '1', type: 'digit', value: '1', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '2', type: 'digit', value: '2', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '3', type: 'digit', value: '3', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '+', type: 'operator', value: 'add', colorClass: 'bg-amber-600 text-white font-bold hover:bg-amber-500' },
    
    // Row 5
    { label: '0', type: 'digit', value: '0', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800' },
    { label: '⌫', type: 'action', value: 'Backspace', colorClass: 'bg-slate-900 text-indigo-400 font-light hover:bg-slate-800' },
    { label: '.', type: 'digit', value: '.', colorClass: 'bg-slate-900 text-slate-100 font-light hover:bg-slate-800 font-bold' },
    { label: '=', type: 'equals', value: '=', colorClass: 'bg-amber-600 text-white font-bold hover:bg-amber-500' },
  ];

  const getActiveOperatorStyle = (btnValue: string) => {
    if (activeOperator && btnValue === activeOperator) {
      return 'z-10 ring-2 ring-indigo-400 bg-amber-500 text-slate-950 font-black';
    }
    return '';
  };

  return (
    <div className="grid grid-cols-4 gap-[1px] bg-slate-700/60 overflow-hidden rounded-lg border border-slate-700/60">
      {buttons.map((btn) => (
        <motion.button
          key={btn.value}
          id={`key-${btn.value}`}
          whileTap={{ scale: 0.98 }}
          onClick={() => onKeyPress(btn.value, btn.type)}
          className={`
            relative h-18 sm:h-20 flex items-center justify-center font-mono text-xl sm:text-2xl transition-colors duration-150 cursor-pointer select-none outline-none
            ${btn.colorClass}
            ${getActiveOperatorStyle(btn.value)}
          `}
        >
          {btn.value === 'Backspace' ? (
            <Delete className="w-5.5 h-5.5" />
          ) : btn.value === '%' ? (
            <Percent className="w-5 h-5" />
          ) : (
            <span>{btn.label}</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
