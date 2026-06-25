export type CalculatorOperator = 'add' | 'subtract' | 'multiply' | 'divide' | null;

export interface HistoryItem {
  id: string;
  formula: string;
  result: string;
  timestamp: Date;
}

export interface CalculatorState {
  displayValue: string;      // The current string in the primary display (e.g. "42.5")
  formula: string;           // The current full mathematical formula representation (e.g. "12 + 3 ×")
  previousValue: number | null; // The accumulated result so far
  currentOperator: CalculatorOperator; // The pending operator
  isNewInput: boolean;       // Whether the next digit keypress should overwrite the display
}

export interface ButtonConfig {
  label: string;
  type: 'digit' | 'operator' | 'action' | 'equals';
  value: string;
  gridSpan?: string;
  colorClass?: string;
}
