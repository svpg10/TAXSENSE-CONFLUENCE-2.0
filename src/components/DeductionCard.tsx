import React from 'react';
import { HelpCircle, Info, ShieldAlert, Award, ArrowUpRight, TrendingUp, Sparkles, CheckCircle, ShieldCheck, Zap, Minus, Plus, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTaxStore } from '../store/useTaxStore';
import { formatINR } from '../utils/taxCalculator';

type ActiveTabType = '80C' | '80D' | 'HRA' | 'NPS' | 'OTHER_SEC';

export const ParamInfo: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative inline-flex items-center ml-1 z-30 group">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5 inline-flex items-center align-middle"
        title={text}
      >
        <Info className="h-3.5 w-3.5 inline text-slate-400 hover:text-blue-500 transition-colors" />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 border border-slate-800 text-white text-[10px] font-medium rounded-lg shadow-xl leading-normal text-left z-50 pointer-events-none transition-all">
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
          {text}
        </div>
      )}
    </div>
  );
};

export default function DeductionCard() {
  const [activeTab, setActiveTab] = React.useState<ActiveTabType>('80C');
  const [regimeOptimizer, setRegimeOptimizer] = React.useState<'OLD' | 'NEW'>('OLD');

  // Load centralized states & actions from Zustand store
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);
  const updateDeduction = useTaxStore((state) => state.updateDeduction);
  const isExtracting = useTaxStore((state) => state.isExtracting);
  const incomeProfile = useTaxStore((state) => state.incomeProfile);

  const val80C = confirmedDeductions['80C'] || 0;
  const val80D = confirmedDeductions['80D'] || 0;
  const valHRA = confirmedDeductions['HRA exemption'] || confirmedDeductions.hraExemption || 0;
  const valNPS = confirmedDeductions['80CCD(1B)'] || 0;

  // Other deductions
  const val80CCD2 = confirmedDeductions['80CCD(2)'] || 0;
  const val80CCH = confirmedDeductions['80CCH'] || 0;
  const valSection24bLetOut = confirmedDeductions['section24bLetOut'] || 0;
  const val80DD = confirmedDeductions['80DD'] || 0;
  const val80U = confirmedDeductions['80U'] || 0;
  const val80DDB = confirmedDeductions['80DDB'] || 0;
  const val80E = confirmedDeductions['80E'] || 0;
  const val80EEA = confirmedDeductions['80EEA'] || 0;
  const val80GG = confirmedDeductions['80GG'] || 0;
  const val80TTA = confirmedDeductions['80TTA'] || 0;
  const val80TTB = confirmedDeductions['80TTB'] || 0;
  const val80G = confirmedDeductions['80G'] || 0;

  // Limits
  const LIMIT_80C = 150000;
  const LIMIT_80D = 75000;
  const LIMIT_HRA = 300000;
  const LIMIT_NPS = 50000;

  // Statutory Limits for Advanced Sections
  const basic = incomeProfile.basicSalary || Math.round((incomeProfile.grossSalary || 0) * 0.4);
  const LIMIT_80CCD2 = Math.round(basic * 0.14);
  const LIMIT_80CCH = 150000;
  const LIMIT_24B_LETOUT = 500000;
  const LIMIT_80DD = 125000;
  const LIMIT_80U = 125000;
  const LIMIT_80DDB = 100000;
  const LIMIT_80E = 500000; // soft cap for display
  const LIMIT_80EEA = 150000;
  const LIMIT_80GG = 60000;
  const LIMIT_80TTA = 10000;
  const LIMIT_80TTB = 50000;
  const LIMIT_80G = 200000; // soft cap for display

  const handleSliderChange = (key: any, maxLimit: number, valStr: string) => {
    const val = Math.min(maxLimit, Math.max(0, parseInt(valStr.replace(/,/g, '')) || 0));
    updateDeduction(key, val);
  };

  const handleTextInputChange = (key: any, maxLimit: number, valStr: string) => {
    const cleaned = valStr.replace(/[^0-9]/g, '');
    const val = Math.min(maxLimit, Math.max(0, parseInt(cleaned) || 0));
    updateDeduction(key, val);
  };

  const setDeductionPreset = (key: any, value: number) => {
    updateDeduction(key, value);
  };

  // Percentage calculations for bars
  const pct80C = Math.min(100, (val80C / LIMIT_80C) * 100);
  const pct80D = Math.min(100, (val80D / LIMIT_80D) * 100);
  const pctHRA = Math.min(100, (valHRA / LIMIT_HRA) * 100);
  const pctNPS = Math.min(100, (valNPS / LIMIT_NPS) * 100);

  // Total deductions summary (Old Regime)
  const totalClaimed = 
    val80C + 
    val80D + 
    valHRA + 
    valNPS + 
    val80CCD2 + 
    val80DD + 
    val80U + 
    val80DDB + 
    val80E + 
    val80EEA + 
    val80GG + 
    val80G + 
    (val80TTB || val80TTA);

  // Calculate dynamic old regime marginal tax rate for advisor callouts
  const grossSalary = incomeProfile.grossSalary || 0;
  const otherIncome = incomeProfile.otherIncome || 0;
  const oldBaseSalaryTotal = Math.max(0, grossSalary - valHRA) + otherIncome;
  const oldSlabTaxable = Math.max(0, oldBaseSalaryTotal - totalClaimed - 50000); // including standard deduction of 50k
  
  let oldMarginalRate = 0;
  let oldMarginalRateStr = '0%';
  if (oldSlabTaxable > 1000000) {
    oldMarginalRate = 0.30;
    oldMarginalRateStr = '30% Bracket';
  } else if (oldSlabTaxable > 500000) {
    oldMarginalRate = 0.20;
    oldMarginalRateStr = '20% Bracket';
  } else if (oldSlabTaxable > 250000) {
    oldMarginalRate = 0.05;
    oldMarginalRateStr = '5% Bracket';
  }

  // Calculate real cash saved by having these deductions
  // Base exemption standard deduction saves tax, but these optional ones save:
  const optionalDeductions = totalClaimed;
  const estimatedCashSaved = Math.round(optionalDeductions * oldMarginalRate * 1.04); // including 4% cess

  // Exemption health percentage (max standard deductions 80C, 80D, NPS is 2.75L)
  const standardShedLimit = LIMIT_80C + LIMIT_80D + LIMIT_NPS;
  const currentStandardShed = val80C + val80D + valNPS;
  const standardShedPct = Math.round((currentStandardShed / standardShedLimit) * 100);

  // Pre-configured optimization presets
  const applyPreset = (presetType: 'standard' | 'aggressive' | 'maximize' | 'reset') => {
    if (presetType === 'standard') {
      updateDeduction('80C', 150000);
      updateDeduction('80D', 25000);
      updateDeduction('HRA exemption', Math.round(grossSalary * 0.08));
      updateDeduction('80CCD(1B)', 0);
    } else if (presetType === 'aggressive') {
      updateDeduction('80C', 150000);
      updateDeduction('80D', 50000);
      updateDeduction('HRA exemption', Math.round(grossSalary * 0.12));
      updateDeduction('80CCD(1B)', 50000);
    } else if (presetType === 'maximize') {
      updateDeduction('80C', LIMIT_80C);
      updateDeduction('80D', LIMIT_80D);
      updateDeduction('HRA exemption', LIMIT_HRA);
      updateDeduction('80CCD(1B)', LIMIT_NPS);
    } else if (presetType === 'reset') {
      updateDeduction('80C', 0);
      updateDeduction('80D', 0);
      updateDeduction('HRA exemption', 0);
      updateDeduction('80CCD(1B)', 0);
      updateDeduction('80CCD(2)', 0);
      updateDeduction('80GG', 0);
      updateDeduction('80E', 0);
      updateDeduction('80EEA', 0);
      updateDeduction('80TTA', 0);
      updateDeduction('80TTB', 0);
    }
  };

  // Dynamic New Regime restructuring calculations:
  const newSlabTaxable = Math.max(0, grossSalary + otherIncome - 75000 - val80CCD2 - val80CCH - valSection24bLetOut);
  let bracketRate = 0.30;
  if (newSlabTaxable <= 400000) bracketRate = 0.0;
  else if (newSlabTaxable <= 800000) bracketRate = 0.05;
  else if (newSlabTaxable <= 1200000) bracketRate = 0.10;
  else if (newSlabTaxable <= 1600000) bracketRate = 0.15;
  else if (newSlabTaxable <= 2000000) bracketRate = 0.20;
  else if (newSlabTaxable <= 2400000) bracketRate = 0.25;

  const maxPotentialNPS = LIMIT_80CCD2;
  const additionalNPSRoom = Math.max(0, maxPotentialNPS - val80CCD2);
  const potentialSavings = Math.round(additionalNPSRoom * bracketRate * 1.04);

  if (isExtracting) {
    return (
      <div id="deductions-card-skeleton" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-800 h-full flex flex-col justify-between animate-pulse">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="space-y-2">
              <div className="h-4 w-44 bg-slate-200 rounded-md" />
              <div className="h-3 w-64 bg-slate-200 rounded-md" />
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
          </div>

          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
            <div className="h-7 flex-1 bg-white rounded-lg" />
            <div className="h-7 flex-1 bg-slate-200 rounded-lg" />
          </div>

          <div className="space-y-5 min-h-[220px] pt-2">
            <div className="flex justify-between items-center">
              <div className="space-y-1.5 w-full">
                <div className="h-4 w-36 bg-slate-200 rounded-md" />
                <div className="h-3 w-48 bg-slate-200 rounded-md" />
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full w-full relative overflow-hidden" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="deductions-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800 h-full flex flex-col justify-between transition-all">
      <div>
        {/* Modern styled Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              Exemption Optimizer
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {regimeOptimizer === 'OLD' ? 'Maximize Chapter VI-A deductions' : 'Leverage employer contributions & perks'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-wide">
              {regimeOptimizer === 'OLD' ? 'Sec VI-A' : 'Sec 80CCD'}
            </span>
          </div>
        </div>

        {regimeOptimizer === 'OLD' ? (
          <div className="space-y-5 mt-4">
            {/* Top Control Panel: 3 rectangular regions side-by-side along a horizontal line */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5 items-stretch">
              {/* Region 1: Regime Toggle Option */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Regime Selection
                  </span>
                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <button
                      onClick={() => setRegimeOptimizer('OLD')}
                      className="w-full py-2 px-3 text-left rounded-lg transition-all cursor-pointer flex items-center justify-between gap-1.5 bg-neutral-900 text-white shadow-xs font-bold"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-amber-400" />
                        <span>Old Regime (VI-A)</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </button>
                    <button
                      onClick={() => setRegimeOptimizer('NEW')}
                      className="w-full py-2 px-3 text-left rounded-lg transition-all cursor-pointer flex items-center justify-between gap-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-slate-400" />
                        <span>New Regime (NPS Plan)</span>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 leading-snug mt-3">
                  Quickly switch between tax system planning engines.
                </div>
              </div>

              {/* Region 2: Deduction Health Meter Panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      Deduction Health
                    </span>
                    <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-sm ${
                      standardShedPct >= 100 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : standardShedPct >= 50 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {standardShedPct}% Optimized
                    </span>
                  </div>

                  {/* Stacked visualization bar */}
                  <div className="space-y-3">
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex border border-slate-300/40">
                      <div 
                        title={`80C: ${formatINR(val80C)}`}
                        className="h-full bg-blue-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                        style={{ width: `${(val80C / standardShedLimit) * 100}%` }}
                      />
                      <div 
                        title={`80D: ${formatINR(val80D)}`}
                        className="h-full bg-emerald-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full border-l border-slate-50"
                        style={{ width: `${(val80D / standardShedLimit) * 100}%` }}
                      />
                      <div 
                        title={`NPS: ${formatINR(valNPS)}`}
                        className="h-full bg-violet-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full border-l border-slate-50"
                        style={{ width: `${(valNPS / standardShedLimit) * 100}%` }}
                      />
                    </div>
                    
                    {/* Extra Detailed Info Bars for category utilization */}
                    <div className="space-y-1.5 border-t border-slate-150/60 pt-2.5">
                      <div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono mb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-blue-500" /> 80C Limit ₹1.5L
                          </span>
                          <span className="text-slate-700">{formatINR(val80C)} ({Math.round(pct80C)}%)</span>
                        </div>
                        <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-350" style={{ width: `${pct80C}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono mb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" /> 80D Limit ₹75k
                          </span>
                          <span className="text-slate-700">{formatINR(val80D)} ({Math.round(pct80D)}%)</span>
                        </div>
                        <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-350" style={{ width: `${pct80D}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 font-mono mb-0.5">
                          <span className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-violet-500" /> NPS Limit ₹50k
                          </span>
                          <span className="text-slate-700">{formatINR(valNPS)} ({Math.round(pctNPS)}%)</span>
                        </div>
                        <div className="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full transition-all duration-350" style={{ width: `${pctNPS}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic bracket-based advise callout */}
                <div className="mt-2 text-[10px] leading-relaxed text-slate-600 font-semibold border-t border-slate-100 pt-1.5">
                  {oldMarginalRate > 0 ? (
                    <span>
                      Slab: <strong className="text-slate-800">{oldMarginalRateStr}</strong>. Savings: <strong className="text-blue-700 font-extrabold">{formatINR(estimatedCashSaved)}</strong>!
                    </span>
                  ) : (
                    <span className="text-slate-500">No slab tax. Exemptions maximized!</span>
                  )}
                </div>
              </div>

              {/* Region 3: 80C, 80D Section Tags (Interactive Tabs) & Presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Exemption Category
                  </span>
                  
                  {/* Tab selection for focused editing (highly responsive to prevent horizontal squishing) */}
                  <div className="grid grid-cols-2 xs:grid-cols-3 xl:grid-cols-5 gap-1 bg-white border border-slate-200/60 p-1 rounded-lg text-[10px] font-bold">
                    {([
                      { id: '80C', label: '80C' },
                      { id: '80D', label: '80D' },
                      { id: 'HRA', label: 'HRA' },
                      { id: 'NPS', label: '80CCD' },
                      { id: 'OTHER_SEC', label: 'Other' }
                    ] as const).map((tab) => (
                      <button
                        id={`tab-deductions-${tab.id}`}
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-1 px-0.5 text-center font-bold rounded-md transition-all cursor-pointer truncate ${
                          activeTab === tab.id
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick One-Click Optimizer Presets inside Category box (highly responsive) */}
                <div className="mt-2.5">
                  <div className="grid grid-cols-2 xs:grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => applyPreset('standard')}
                      className="py-1 px-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-600 rounded-md text-center transition-all cursor-pointer"
                      title="Apply Standard Profile Deductions"
                    >
                      Corp
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('aggressive')}
                      className="py-1 px-0.5 bg-blue-50/50 hover:bg-blue-100/60 border border-blue-200 text-[9px] font-bold text-blue-700 rounded-md text-center transition-all cursor-pointer"
                      title="Apply Aggressive Exemption Strategy"
                    >
                      Aggr
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('maximize')}
                      className="py-1 px-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[9px] font-bold text-emerald-700 rounded-md text-center transition-all cursor-pointer"
                      title="Max Out All Sections"
                    >
                      Max
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('reset')}
                      className="py-1 px-0.5 bg-rose-50/40 hover:bg-rose-100/50 border border-rose-200 text-[9px] font-bold text-rose-700 rounded-md text-center transition-all cursor-pointer"
                      title="Clear All Exemptions"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Below Top Control Panel: Focused Sliders */}
            <div className="bg-slate-50/10 border border-slate-150 rounded-xl p-4.5">
              {/* Focused Tab Content with Premium Interactive Controls */}
              <div className="space-y-4 min-h-[220px]">
                <AnimatePresence mode="wait">
                  {activeTab === '80C' && (
                    <motion.div
                      key="80C"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.12 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-700 flex flex-wrap items-center gap-1.5 uppercase tracking-wider">
                              Section 80C Exemptions
                              <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 normal-case shrink-0">Old regime only</span>
                              <ParamInfo text="Includes Employee Provident Fund (EPF), PPF, ELSS Tax Saver Funds, Life Insurance Premium, home loan principal repayment, and children's school tuition fees." />
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">EPF, PPF, ELSS, Insurance, Home Principal</p>
                          </div>
                          
                          {/* Live Text Field + Numeric formatting */}
                          <div className="relative shrink-0 w-32">
                            <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-semibold">₹</span>
                            <input
                              type="text"
                              value={val80C ? val80C.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80C', LIMIT_80C, e.target.value)}
                              placeholder="0"
                              className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                            />
                          </div>
                        </div>

                        {/* Styled slider track */}
                        <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => setDeductionPreset('80C', Math.max(0, val80C - 5000))}
                              className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              id="range-80c"
                              type="range"
                              min="0"
                              max={LIMIT_80C}
                              step="5000"
                              value={val80C}
                              onChange={(e) => handleSliderChange('80C', LIMIT_80C, e.target.value)}
                              className="flex-1 accent-neutral-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer border border-slate-300/40"
                            />
                            <button 
                              type="button"
                              onClick={() => setDeductionPreset('80C', Math.min(LIMIT_80C, val80C + 5000))}
                              className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono font-semibold">
                            <span>₹0</span>
                            <span>₹75K (50%)</span>
                            <span className="font-bold text-slate-500">₹1.5L Limit</span>
                          </div>
                        </div>

                        {/* Quick Preset Buttons - Super Convenient */}
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80C', 0)}
                            className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                          >
                            Reset
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80C', 50000)}
                            className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                          >
                            ₹50K (PPF)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80C', 100000)}
                            className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                          >
                            ₹1.0L (ELSS)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80C', LIMIT_80C)}
                            className="text-[9px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Zap className="h-2.5 w-2.5 animate-pulse" />
                            Max out (1.5L)
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-2xl h-full flex flex-col justify-center space-y-3 shadow-2xs">
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4 text-blue-600" />
                            Exemption Breakdown
                          </span>
                          <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                            💡 <strong>Tax Savings Tip:</strong> Your employer's mandatory EPF deduction is pre-counted here. Make voluntary PPF transfers or tax-saver <strong>ELSS mutual funds</strong> to shield the leftover room!
                          </p>
                          <div className="border-t border-blue-100 pt-2.5 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                            <span>Slab Savings Rate</span>
                            <span className="font-mono text-blue-700 font-extrabold">{oldMarginalRateStr} (Approx)</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                {activeTab === '80D' && (
                  <motion.div
                    key="80D"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-700 flex flex-wrap items-center gap-1.5 uppercase tracking-wider">
                            Section 80D Health Premiums
                            <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 normal-case shrink-0">Old regime only</span>
                            <ParamInfo text="Deductions of up to ₹25,000 on medical insurance for self, spouse, and dependent children. Additional ₹50,000 limit available for parents who are senior citizens." />
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Medical & Health Insurance Premiums</p>
                        </div>
                        
                        {/* Live Text Field */}
                        <div className="relative shrink-0 w-32">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-semibold">₹</span>
                          <input
                            type="text"
                            value={val80D ? val80D.toLocaleString('en-IN') : ''}
                            onChange={(e) => handleTextInputChange('80D', LIMIT_80D, e.target.value)}
                            placeholder="0"
                            className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80D', Math.max(0, val80D - 2500))}
                            className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            id="range-80d"
                            type="range"
                            min="0"
                            max={LIMIT_80D}
                            step="2500"
                            value={val80D}
                            onChange={(e) => handleSliderChange('80D', LIMIT_80D, e.target.value)}
                            className="flex-1 accent-neutral-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer border border-slate-300/40"
                          />
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80D', Math.min(LIMIT_80D, val80D + 2500))}
                            className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono font-semibold">
                          <span>₹0</span>
                          <span>₹25K (Self/Family)</span>
                          <span className="font-bold text-slate-500">₹75K Limit</span>
                        </div>
                      </div>

                      {/* Quick Preset Buttons */}
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80D', 0)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80D', 25000)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          ₹25K (Family Only)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80D', 50000)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          ₹50K (Parents Only)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80D', LIMIT_80D)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Zap className="h-2.5 w-2.5" />
                          Max out (75K)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl h-full flex flex-col justify-center space-y-3 shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          Health Shield Profile
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                          🛡️ Self limits are capped at <strong>₹25,000</strong>. Adding premiums paid for <strong>senior citizen parents</strong> unlocks an additional <strong>₹50,000</strong> allowance.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'HRA' && (
                  <motion.div
                    key="HRA"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-700 flex flex-wrap items-center gap-1.5 uppercase tracking-wider">
                            House Rent Allowance (HRA)
                            <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 normal-case shrink-0">Old regime only</span>
                            <ParamInfo text="Exempt portion under Section 10(13A). Based on rent receipts. Under the Old Regime, HRA is highly exempt; in the New Regime, it is entirely disallowed." />
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Exempt portion of rent paid</p>
                        </div>
                        
                        {/* Live Text Field */}
                        <div className="relative shrink-0 w-32">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-semibold">₹</span>
                          <input
                            type="text"
                            value={valHRA ? valHRA.toLocaleString('en-IN') : ''}
                            onChange={(e) => handleTextInputChange('HRA exemption', LIMIT_HRA, e.target.value)}
                            placeholder="0"
                            className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('HRA exemption', Math.max(0, valHRA - 10000))}
                            className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            id="range-hra"
                            type="range"
                            min="0"
                            max={LIMIT_HRA}
                            step="5000"
                            value={valHRA}
                            onChange={(e) => handleSliderChange('HRA exemption', LIMIT_HRA, e.target.value)}
                            className="flex-1 accent-neutral-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer border border-slate-300/40"
                          />
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('HRA exemption', Math.min(LIMIT_HRA, valHRA + 10000))}
                            className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono font-semibold">
                          <span>₹0</span>
                          <span>₹1.5L (Metro average)</span>
                          <span className="font-bold text-slate-500">₹3.0L Target</span>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('HRA exemption', 0)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('HRA exemption', 60000)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          ₹60K (Non-Metro)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('HRA exemption', 120000)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          ₹1.2L (Metro)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('HRA exemption', LIMIT_HRA)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Zap className="h-2.5 w-2.5" />
                          Max out (3L)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="p-4 bg-amber-50/50 border border-amber-150 rounded-2xl h-full flex flex-col justify-center space-y-3 shadow-2xs">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                          HRA Policy Note
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                          <strong>Disallowed in New Regime:</strong> HRA exemptions can only be claimed if you elect the Old Tax Regime. In the New Regime, your full HRA is completely taxable.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'NPS' && (
                  <motion.div
                    key="NPS"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-700 flex flex-wrap items-center gap-1.5 uppercase tracking-wider">
                            Section 80CCD(1B) NPS
                            <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 normal-case shrink-0">Old regime only</span>
                            <ParamInfo text="Voluntary contributions to National Pension System (NPS Tier 1). Offers an exclusive tax shelter of ₹50,000 completely separate from the standard ₹1.5L limit under 80C." />
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Voluntary Pension Scheme contributions</p>
                        </div>
                        
                        {/* Live Text Field */}
                        <div className="relative shrink-0 w-32">
                          <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-semibold">₹</span>
                          <input
                            type="text"
                            value={valNPS ? valNPS.toLocaleString('en-IN') : ''}
                            onChange={(e) => handleTextInputChange('80CCD(1B)', LIMIT_NPS, e.target.value)}
                            placeholder="0"
                            className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80CCD(1B)', Math.max(0, valNPS - 5000))}
                            className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            id="range-nps"
                            type="range"
                            min="0"
                            max={LIMIT_NPS}
                            step="5000"
                            value={valNPS}
                            onChange={(e) => handleSliderChange('80CCD(1B)', LIMIT_NPS, e.target.value)}
                            className="flex-1 accent-neutral-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer border border-slate-300/40"
                          />
                          <button 
                            type="button"
                            onClick={() => setDeductionPreset('80CCD(1B)', Math.min(LIMIT_NPS, valNPS + 5000))}
                            className="p-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-md transition-colors cursor-pointer shadow-2xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono font-semibold">
                          <span>₹0</span>
                          <span>₹25K (50%)</span>
                          <span className="font-bold text-slate-500">₹50K Limit</span>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="flex gap-1.5 flex-wrap pt-0.5">
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80CCD(1B)', 0)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80CCD(1B)', 20000)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          ₹20K
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80CCD(1B)', 35000)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                        >
                          ₹35K
                        </button>
                        <button 
                          type="button"
                          onClick={() => setDeductionPreset('80CCD(1B)', LIMIT_NPS)}
                          className="text-[9px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Zap className="h-2.5 w-2.5 animate-pulse" />
                          Max out (50K)
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl h-full flex flex-col justify-center space-y-3 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-violet-600" />
                          NPS Power-Up Info
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                          📈 NPS investments are superpowered: They give you an extra <strong>₹50,000</strong> tax deduction that is completely outside the ₹1.5 Lakhs 80C limit!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'OTHER_SEC' && (
                  <motion.div
                    key="OTHER_SEC"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-4 max-h-[300px] overflow-y-auto pr-1"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                      <span>Other Individual Deductions (2-Column Grid Layout)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 80CCD(2) - Employer NPS */}
                      <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-[11px] gap-2">
                          <span className="font-bold text-slate-700 flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            80CCD(2) Employer NPS
                            <span className="text-[7.5px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-150 shrink-0 uppercase tracking-wide">Old & New</span>
                            <ParamInfo text="Deduction on employer's match up to 14% of basic salary. This is extremely unique because it is allowed in BOTH the Old and New regimes!" />
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                            <input 
                              type="text"
                              value={val80CCD2 ? val80CCD2.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80CCD(2)', LIMIT_80CCD2 || 150000, e.target.value)}
                              placeholder="0"
                              className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-right text-slate-800"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={LIMIT_80CCD2 || 50000}
                          step="5000"
                          value={val80CCD2}
                          onChange={(e) => handleSliderChange('80CCD(2)', LIMIT_80CCD2 || 150000, e.target.value)}
                          className="w-full accent-neutral-900 h-1 bg-slate-200 appearance-none cursor-pointer rounded"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-semibold font-mono">
                          <span>₹0</span>
                          <span>Max 14% of Basic ({formatINR(LIMIT_80CCD2)})</span>
                        </div>
                      </div>

                      {/* 80GG - Rent paid without HRA */}
                      <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-[11px] gap-2">
                          <span className="font-bold text-slate-700 flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            80GG Rent (No HRA)
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 shrink-0 uppercase tracking-wide">Old only</span>
                            <ParamInfo text="Claim rent paid if HRA is not part of your salary stack. Capped at ₹5,000/month (₹60,000/year)." />
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                            <input 
                              type="text"
                              value={val80GG ? val80GG.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80GG', LIMIT_80GG, e.target.value)}
                              placeholder="0"
                              className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-right text-slate-800"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={LIMIT_80GG}
                          step="2000"
                          value={val80GG}
                          onChange={(e) => handleSliderChange('80GG', LIMIT_80GG, e.target.value)}
                          className="w-full accent-neutral-900 h-1 bg-slate-200 appearance-none cursor-pointer rounded"
                        />
                      </div>

                      {/* 80E - Education Loan Interest */}
                      <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-[11px] gap-2">
                          <span className="font-bold text-slate-700 flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            80E Education Loan Int.
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 shrink-0 uppercase tracking-wide">Old only</span>
                            <ParamInfo text="Deduct the entire interest paid on higher education loans for self, spouse or children with no maximum ceiling." />
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                            <input 
                              type="text"
                              value={val80E ? val80E.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80E', LIMIT_80E, e.target.value)}
                              placeholder="0"
                              className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-right text-slate-800"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={LIMIT_80E}
                          step="5000"
                          value={val80E}
                          onChange={(e) => handleSliderChange('80E', LIMIT_80E, e.target.value)}
                          className="w-full accent-neutral-900 h-1 bg-slate-200 appearance-none cursor-pointer rounded"
                        />
                      </div>

                      {/* 80EEA - First-time buyer interest */}
                      <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-[11px] gap-2">
                          <span className="font-bold text-slate-700 flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            80EEA Home Loan Interest
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 shrink-0 uppercase tracking-wide">Old only</span>
                            <ParamInfo text="Deduction of up to ₹1,50,000 for interest on housing loans for first-time home buyers." />
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                            <input 
                              type="text"
                              value={val80EEA ? val80EEA.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80EEA', LIMIT_80EEA, e.target.value)}
                              placeholder="0"
                              className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-right text-slate-800"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={LIMIT_80EEA}
                          step="5000"
                          value={val80EEA}
                          onChange={(e) => handleSliderChange('80EEA', LIMIT_80EEA, e.target.value)}
                          className="w-full accent-neutral-900 h-1 bg-slate-200 appearance-none cursor-pointer rounded"
                        />
                      </div>

                      {/* 80TTA / 80TTB - Savings Interest */}
                      <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-[11px] gap-2">
                          <span className="font-bold text-slate-700 flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            80TTA Savings Int. (Non-Seniors)
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 shrink-0 uppercase tracking-wide">Old only</span>
                            <ParamInfo text="Deduction up to ₹10,000 on savings interest for taxpayers below 60 years old." />
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                            <input 
                              type="text"
                              value={val80TTA ? val80TTA.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80TTA', LIMIT_80TTA, e.target.value)}
                              placeholder="0"
                              className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-right text-slate-800"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={LIMIT_80TTA}
                          step="1000"
                          value={val80TTA}
                          onChange={(e) => handleSliderChange('80TTA', LIMIT_80TTA, e.target.value)}
                          className="w-full accent-neutral-900 h-1 bg-slate-200 appearance-none cursor-pointer rounded"
                        />
                      </div>

                      <div className="space-y-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-[11px] gap-2">
                          <span className="font-bold text-slate-700 flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                            80TTB Senior Savings/FD Int.
                            <span className="text-[7.5px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded border border-slate-200 shrink-0 uppercase tracking-wide">Old only</span>
                            <ParamInfo text="Exemption up to ₹50,000 on both savings and FD interest for seniors (60+ years)." />
                          </span>
                          <div className="relative w-28 shrink-0">
                            <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                            <input 
                              type="text"
                              value={val80TTB ? val80TTB.toLocaleString('en-IN') : ''}
                              onChange={(e) => handleTextInputChange('80TTB', LIMIT_80TTB, e.target.value)}
                              placeholder="0"
                              className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-right text-slate-800"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={LIMIT_80TTB}
                          step="2500"
                          value={val80TTB}
                          onChange={(e) => handleSliderChange('80TTB', LIMIT_80TTB, e.target.value)}
                          className="w-full accent-neutral-900 h-1 bg-slate-200 appearance-none cursor-pointer rounded"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Running Subtotals Summary Container */}
            <div className="border-t border-slate-100 pt-3.5 mt-4 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-2xs">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total Exemption Shelter (Old)</span>
                <motion.span
                  key={totalClaimed}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  className="font-mono font-extrabold text-blue-700 text-sm bg-blue-50/80 border border-blue-100 px-2 py-1 rounded-lg"
                >
                  {formatINR(totalClaimed)}
                </motion.span>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[10.5px] text-amber-850 leading-normal">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Under the <strong>New Regime</strong>, normal exemptions (80C, 80D, rent) are disallowed. Toggle the <strong>New Regime</strong> planner above to unlock employer-matching NPS structures!
                </span>
              </div>
            </div>
          </div>
        </div>
        ) : (
          /* NEW REGIME PLANNER / OPTIMIZER TAB */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            className="space-y-5 mt-4"
          >
            {/* Top Control Panel: 3 rectangular regions side-by-side along a horizontal line */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5 items-stretch">
              {/* Region 1: Regime Toggle Option */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    Regime Selection
                  </span>
                  <div className="flex flex-col gap-1.5 text-xs font-semibold">
                    <button
                      onClick={() => setRegimeOptimizer('OLD')}
                      className="w-full py-2 px-3 text-left rounded-lg transition-all cursor-pointer flex items-center justify-between gap-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-slate-400" />
                        <span>Old Regime (VI-A)</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setRegimeOptimizer('NEW')}
                      className="w-full py-2 px-3 text-left rounded-lg transition-all cursor-pointer flex items-center justify-between gap-1.5 bg-neutral-900 text-white shadow-xs font-bold"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        <span>New Regime (NPS Plan)</span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </button>
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 leading-snug mt-3">
                  Quickly switch between tax system planning engines.
                </div>
              </div>

              {/* Region 2: New Regime Automatic Benefits Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Automatic System Allowances</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-700 py-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold">
                        ✔️ Standard Deduction
                        <ParamInfo text="Flat salary exemption automatically deducted. Budget 2024 upgraded this allowance from ₹50,000 to ₹75,000 under the New Regime." />
                      </span>
                      <span className="font-mono font-extrabold text-slate-800">{formatINR(75000)}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-700 py-0.5 border-t border-slate-100 pt-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold">
                        ✔️ Marginal Tax Relief
                        <ParamInfo text="Ensures your incremental tax never exceeds your salary earnings above the ₹7,0,000 rebate threshold." />
                      </span>
                      <span className="text-slate-400 text-[9px] italic font-semibold">Auto-Calculated</span>
                    </div>
                  </div>
                </div>
                <div className="text-[9.5px] text-slate-400 italic leading-snug mt-2">
                  No Chapter VI-A investment proofs are needed for these!
                </div>
              </div>

              {/* Region 3: Smart Advisory Block */}
              <div className="flex flex-col justify-between">
                {potentialSavings > 0 ? (
                  <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-xl flex-1 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          NPS Strategy
                        </span>
                      </div>
                      <p className="text-[10.5px] leading-relaxed font-semibold text-emerald-900">
                        Structuring <strong>{formatINR(additionalNPSRoom)}</strong> as Corporate NPS saves <span className="text-emerald-700 font-extrabold">{formatINR(potentialSavings)}</span> in taxes!
                      </p>
                    </div>
                    <div className="text-[9px] text-emerald-600 font-bold mt-1">Immediate Cash Gain Available</div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-150 text-blue-800 p-4 rounded-xl flex-1 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                          Fully Optimized
                        </span>
                      </div>
                      <p className="text-[10.5px] leading-relaxed font-semibold text-blue-900">
                        Your corporate structure maximizes Section 80CCD(2) contribution perfectly.
                      </p>
                    </div>
                    <div className="text-[9px] text-blue-600 font-bold mt-1">Exemption stack fully optimized!</div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Banner about limited deductions */}
            <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-[10.5px] text-blue-800 leading-relaxed shadow-3xs">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
              <span>
                💡 <strong>New Regime Exemption Shield</strong>: Standard deductions like 80C (PPF/LIC), 80D (health), and rent/HRA are disallowed here. However, you can save taxes under the New Regime using these three exclusive, high-yield shelters:
              </span>
            </div>

            {/* Below Top Control Panel: Three New Regime Interactive Levers */}
            <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-3xs space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Interactive New Regime Shelters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                {/* Lever 1: 80CCD(2) Employer NPS */}
                <div className="bg-blue-50/20 border border-blue-100 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex flex-wrap items-center gap-1">
                          Employer NPS (80CCD(2))
                          <ParamInfo text="Company contribution to your National Pension System account. Allowed up to 14% of basic salary." />
                        </h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Corporate retirement benefit match</p>
                      </div>
                      <div className="relative shrink-0 w-24">
                        <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                        <input
                          type="text"
                          value={val80CCD2 ? val80CCD2.toLocaleString('en-IN') : ''}
                          onChange={(e) => handleTextInputChange('80CCD(2)', maxPotentialNPS || 150000, e.target.value)}
                          placeholder="0"
                          className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-2 bg-white p-2 rounded-lg border border-slate-200/50">
                      <input
                        type="range"
                        min="0"
                        max={maxPotentialNPS || 50000}
                        step="5000"
                        value={val80CCD2}
                        onChange={(e) => handleSliderChange('80CCD(2)', maxPotentialNPS || 150000, e.target.value)}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono font-semibold">
                        <span>₹0</span>
                        <span>Max 14% of Basic ({formatINR(maxPotentialNPS)})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1.5 justify-between items-center border-t border-slate-100 mt-1">
                    <button 
                      type="button"
                      onClick={() => setDeductionPreset('80CCD(2)', 0)}
                      className="text-[8.5px] font-bold px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeductionPreset('80CCD(2)', maxPotentialNPS)}
                      className="text-[8.5px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-blue-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      <Zap className="h-2 w-2 animate-pulse" /> Max Match
                    </button>
                  </div>
                </div>

                {/* Lever 2: 80CCH Agnipath Corpus Fund */}
                <div className="bg-violet-50/20 border border-violet-100 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex flex-wrap items-center gap-1">
                          Agnipath Scheme (80CCH)
                          <ParamInfo text="Government-matching Agnipath scheme contribution for Agniveers. Fully tax-deductible in the New Regime." />
                        </h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Agniveer Corpus Fund shelter</p>
                      </div>
                      <div className="relative shrink-0 w-24">
                        <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                        <input
                          type="text"
                          value={val80CCH ? val80CCH.toLocaleString('en-IN') : ''}
                          onChange={(e) => handleTextInputChange('80CCH', LIMIT_80CCH, e.target.value)}
                          placeholder="0"
                          className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-2 bg-white p-2 rounded-lg border border-violet-200/50">
                      <input
                        type="range"
                        min="0"
                        max={LIMIT_80CCH}
                        step="5000"
                        value={val80CCH}
                        onChange={(e) => handleSliderChange('80CCH', LIMIT_80CCH, e.target.value)}
                        className="w-full accent-violet-600 h-1 bg-slate-200 rounded appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono font-semibold">
                        <span>₹0</span>
                        <span>Limit: {formatINR(LIMIT_80CCH)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1.5 justify-between items-center border-t border-slate-100 mt-1">
                    <button 
                      type="button"
                      onClick={() => setDeductionPreset('80CCH', 0)}
                      className="text-[8.5px] font-bold px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeductionPreset('80CCH', 50000)}
                      className="text-[8.5px] font-bold px-2 py-0.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded text-violet-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      ₹50,000
                    </button>
                  </div>
                </div>

                {/* Lever 3: section24bLetOut Home Loan Interest Let-out */}
                <div className="bg-emerald-50/20 border border-emerald-100 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex flex-wrap items-center gap-1">
                          Let-Out Property (Sec 24b)
                          <ParamInfo text="Interest on home loan for Let-Out properties. Self-occupied home loan interest is disallowed in New Regime, but Let-Out property interest is 100% tax-deductible." />
                        </h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">Rental property interest deductions</p>
                      </div>
                      <div className="relative shrink-0 w-24">
                        <span className="absolute left-1.5 top-0.5 text-slate-400 text-[10px] font-bold">₹</span>
                        <input
                          type="text"
                          value={valSection24bLetOut ? valSection24bLetOut.toLocaleString('en-IN') : ''}
                          onChange={(e) => handleTextInputChange('section24bLetOut', LIMIT_24B_LETOUT, e.target.value)}
                          placeholder="0"
                          className="w-full pl-4 pr-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-2 bg-white p-2 rounded-lg border border-emerald-200/50">
                      <input
                        type="range"
                        min="0"
                        max={LIMIT_24B_LETOUT}
                        step="10000"
                        value={valSection24bLetOut}
                        onChange={(e) => handleSliderChange('section24bLetOut', LIMIT_24B_LETOUT, e.target.value)}
                        className="w-full accent-emerald-600 h-1 bg-slate-200 rounded appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono font-semibold">
                        <span>₹0</span>
                        <span>Limit: {formatINR(LIMIT_24B_LETOUT)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 pt-1.5 justify-between items-center border-t border-slate-100 mt-1">
                    <button 
                      type="button"
                      onClick={() => setDeductionPreset('section24bLetOut', 0)}
                      className="text-[8.5px] font-bold px-2 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDeductionPreset('section24bLetOut', 150000)}
                      className="text-[8.5px] font-bold px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      ₹1.5L
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Exemption Optimizer Footer */}
      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
        <span>Filing Year: FY 2025-26</span>
        <a 
          href="https://www.incometax.gov.in/iec/foportal/help/individual/tax-slabs" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-0.5 text-blue-600 hover:underline cursor-pointer lowercase normal-case tracking-normal"
        >
          Official slab guidelines <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
