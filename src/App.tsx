import React, { useState } from 'react';
import { TaxData } from './types';
import { TAX_CONFIG } from './config';
import { calculateTax, formatINR } from './utils/taxCalculator';
import DeductionCard from './components/DeductionCard';
import RegimeComparison from './components/RegimeComparison';
import ChatInterface from './components/ChatInterface';
import ExtractionConfirm from './components/ExtractionConfirm';
import ExportControl from './components/ExportControl';
import FilingGuide from './components/FilingGuide';
import Form16Import from './components/Form16Import';
import { FinanceNewsTicker } from './components/FinanceNewsTicker';
import { PortfolioSync } from './components/PortfolioSync';
import { useTaxStore, useTaxStoreHydrated } from './store/useTaxStore';
import LandingPage from './components/LandingPage';
import GuidelinesInfoBar from './components/GuidelinesInfoBar';
import { 
  Lock, 
  SlidersHorizontal, 
  Calculator, 
  BookOpen, 
  RotateCcw,
  ListTodo,
  TrendingUp,
  Info,
} from 'lucide-react';

const ParamInfo: React.FC<{ text: string }> = ({ text }) => {
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

export default function App() {
  const hydrated = useTaxStoreHydrated();
  const [isFilingGuideOpen, setIsFilingGuideOpen] = useState(false);

  // Load centralized store values and modifiers
  const incomeProfile = useTaxStore((state) => state.incomeProfile);
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);
  const setIncomeProfile = useTaxStore((state) => state.setIncomeProfile);
  const updateDeduction = useTaxStore((state) => state.updateDeduction);
  const addChatMessage = useTaxStore((state) => state.addChatMessage);
  const setIsStoreExtracting = useTaxStore((state) => state.setIsExtracting);
  const clearSession = useTaxStore((state) => state.clearSession);
  const formType = useTaxStore((state) => state.formType);
  const setFormType = useTaxStore((state) => state.setFormType);
  const multiHouse = useTaxStore((state) => state.multiHouse);
  const setMultiHouse = useTaxStore((state) => state.setMultiHouse);
  const foreignAssets = useTaxStore((state) => state.foreignAssets);
  const setForeignAssets = useTaxStore((state) => state.setForeignAssets);
  const currentStep = useTaxStore((state) => state.currentStep);
  const setStep = useTaxStore((state) => state.setStep);

  // Form 16 extraction UI state
  const [extractedData, setExtractedData] = useState<Partial<TaxData> | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);

  // Derive taxData state from Zustand store for calculations and reviews
  const taxData: TaxData = {
    assessmentYear: TAX_CONFIG.assessmentYear,
    grossSalary: incomeProfile.grossSalary || 0,
    hraExemption: confirmedDeductions['HRA exemption'] || confirmedDeductions.hraExemption || 0,
    ltaExemption: 0,
    standardDeductionOld: TAX_CONFIG.standardDeductionOld,
    standardDeductionNew: TAX_CONFIG.standardDeductionNew,
    otherIncome: incomeProfile.otherIncome || 0,
    deduction80C: confirmedDeductions['80C'] || 0,
    deduction80D: confirmedDeductions['80D'] || 0,
    deduction80TTA: confirmedDeductions['80TTA'] || 0,
    deduction80G: confirmedDeductions['80G'] || 0,
    section24b: confirmedDeductions['section24b'] || 0,
    tdsDeducted: incomeProfile.tdsDeducted || 0,
    // Advanced & Portfolio fields
    stcg: incomeProfile.stcg || 0,
    ltcg: incomeProfile.ltcg || 0,
    deduction80CCD1B: confirmedDeductions['80CCD(1B)'] || 0,
    deduction80CCD2: confirmedDeductions['80CCD(2)'] || 0,
    deduction80DD: confirmedDeductions['80DD'] || 0,
    deduction80U: confirmedDeductions['80U'] || 0,
    deduction80DDB: confirmedDeductions['80DDB'] || 0,
    deduction80E: confirmedDeductions['80E'] || 0,
    deduction80EEA: confirmedDeductions['80EEA'] || 0,
    deduction80GG: confirmedDeductions['80GG'] || 0,
    deduction80TTB: confirmedDeductions['80TTB'] || 0,
  };

  // Handle manually inputting salary/interest/TDS
  const handleNumericChange = (key: 'grossSalary' | 'otherIncome' | 'tdsDeducted', value: number) => {
    setIncomeProfile({ [key]: Math.max(0, value) });
  };

  // Triggers when raw Form 16 text is parsed
  const handleForm16TextProcessing = async (text: string) => {
    try {
      setIsExtracting(true);
      setIsStoreExtracting(true);
      setShowConfirmScreen(true);
      setExtractedData(null); // Reset previous extraction

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setExtractedData(result.data);
      } else {
        throw new Error(result.error || 'Failed to extract Form 16 details.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Extraction failed: ${err.message || 'Please check the file layout and try again.'}`);
      setShowConfirmScreen(false);
    } finally {
      setIsExtracting(false);
      setIsStoreExtracting(false);
    }
  };

  // Triggers when user accepts extracted Form 16 details
  const handleConfirmExtraction = (confirmedData: TaxData) => {
    // 1. Sync values back to store
    setIncomeProfile({
      grossSalary: confirmedData.grossSalary,
      tdsDeducted: confirmedData.tdsDeducted,
      otherIncome: confirmedData.otherIncome,
    });
    updateDeduction('80C', confirmedData.deduction80C);
    updateDeduction('80D', confirmedData.deduction80D);
    updateDeduction('HRA exemption', confirmedData.hraExemption);

    setShowConfirmScreen(false);

    // 2. Append rich notification message to store chat history
    const successMsg = {
      role: 'assistant' as const,
      content: `🎉 **Successfully parsed and applied Form 16 values!**

I have synchronized the extracted values into your active tax calculator:
- **Gross Salary**: ${formatINR(confirmedData.grossSalary)}
- **HRA Exemption**: ${formatINR(confirmedData.hraExemption)}
- **TDS Deposited**: ${formatINR(confirmedData.tdsDeducted)}
- **Sec 80C Deductions**: ${formatINR(confirmedData.deduction80C)}
- **Sec 80D Deductions**: ${formatINR(confirmedData.deduction80D)}

According to my calculations, the optimal regime for you is the **${calculateTax(confirmedData).recommendedRegime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}** which saves you **${formatINR(calculateTax(confirmedData).savings)}**. 

Ask me anything about these numbers or how we can file your ITR-1 Sahaj based on this!`,
    };
    addChatMessage(successMsg);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold animate-pulse">Loading secure tax session...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'HOME') {
    return <LandingPage onStart={() => setStep('LANDING')} />;
  }

  return (
    <div id="taxsense-app" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header id="app-header" className="border-b border-slate-200 bg-white sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100 text-white flex items-center justify-center">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">TaxSense</h1>
              <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border font-mono ${
                formType === 'ITR-2' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {formType} COPILOT
              </span>
            </div>
            <p className="text-xs text-slate-500">Conversational filing assistant for salaried professionals</p>
          </div>
        </div>

        {/* Security & Period Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-open-filing-guide"
            onClick={() => setIsFilingGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-150 text-blue-700 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Open ITR filing guide"
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-600" />
            <span>{formType} Filing Checklist</span>
          </button>

          <button
            id="btn-reset-session"
            onClick={clearSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
            title="Start a new tax session with preloaded defaults"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset Session</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
            <span className="text-slate-400">AY:</span>
            <span className="text-slate-700 font-semibold">{TAX_CONFIG.assessmentYear}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">FY:</span>
            <span className="text-slate-700 font-semibold">{TAX_CONFIG.financialYear}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-[11px]">Secure sandbox environment</span>
          </div>
        </div>
      </header>

      {/* Finance News Ticker */}
      <FinanceNewsTicker />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Interactive Filing Guidelines & Info Bar */}
        <GuidelinesInfoBar />

        {/* Form 16 Review / Confirm Overlay Banner */}
        {showConfirmScreen && (
          <div id="confirm-overlay" className="animate-fade-in">
            <ExtractionConfirm
              extractedData={extractedData}
              onConfirm={handleConfirmExtraction}
              onCancel={() => setShowConfirmScreen(false)}
              isProcessing={isExtracting}
            />
          </div>
        )}

        {/* Tiered Layout - Perfectly aligned horizontal rows */}
        <div className="space-y-6">
          
          {/* Row 1: Salary Profile Setting, Form 16 Import Hub, and ITR Eligibility Assessor (Top horizontal line) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Salary Profile Settings Card */}
            <div className="flex flex-col h-full">
              <div id="salary-profile-settings-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                      Salary Profile Settings
                      <ParamInfo text="Define your primary income details. You can enter them manually here or upload a Form 16 to populate them automatically." />
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Gross Salary */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center">
                        Gross Salary (Annum)
                        <ParamInfo text="Your total salary earned in the financial year before any standard deductions, house rent allowances, or other exemptions are subtracted." />
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">₹</span>
                        <input
                          id="input-gross-salary"
                          type="number"
                          value={taxData.grossSalary || ''}
                          onChange={(e) => handleNumericChange('grossSalary', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-7 pr-3 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                          step={10000}
                        />
                      </div>
                      <input
                        type="range"
                        min="200000"
                        max="3000000"
                        step="25000"
                        value={taxData.grossSalary}
                        onChange={(e) => handleNumericChange('grossSalary', parseInt(e.target.value) || 0)}
                        className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
                      />
                    </div>

                    {/* Other income */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center">
                        Other Interest Income
                        <ParamInfo text="Includes interest earned from savings bank accounts, fixed deposits (FDs), recurring deposits, dividends, or other taxable sources." />
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">₹</span>
                        <input
                          id="input-other-income"
                          type="number"
                          value={taxData.otherIncome || ''}
                          onChange={(e) => handleNumericChange('otherIncome', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-7 pr-3 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Savings bank interest, FDs, dividends</p>
                    </div>

                    {/* TDS Deducted */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center">
                        TDS Deposited (Form 26AS/16)
                        <ParamInfo text="Tax Deducted at Source (TDS) already withheld and submitted on your behalf by your employer or banks, acting as tax payment credits." />
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">₹</span>
                        <input
                          id="input-tds-deducted"
                          type="number"
                          value={taxData.tdsDeducted || ''}
                          onChange={(e) => handleNumericChange('tdsDeducted', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-7 pr-3 text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Advance tax already paid</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form 16 Import Hub Card */}
            <div className="flex flex-col h-full">
              <div id="form16-import-hub" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
                <Form16Import onFileUpload={handleForm16TextProcessing} />
              </div>
            </div>

            {/* ITR Eligibility Assessor Card */}
            <div className="flex flex-col h-full">
              <div id="itr-eligibility-assessor-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-4.5 w-4.5 text-neutral-800" />
                        ITR Eligibility Assessor
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Determine if you need Form ITR-1 or ITR-2</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      formType === 'ITR-2'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      Active: {formType}
                    </span>
                  </div>

                  {/* Dynamic Assessor Checkbox Panel */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-3 mt-3">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Check all conditions that apply to you:
                    </span>
                    
                    <div className="space-y-3 text-xs">
                      {/* High Salary Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          id="chk-itr-high-salary"
                          type="checkbox"
                          checked={taxData.grossSalary > 5000000}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            handleNumericChange('grossSalary', checked ? 5100000 : 850000);
                          }}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-800 leading-normal">
                          My Gross Income exceeds <strong>₹50 Lakhs</strong>
                          {taxData.grossSalary > 5000000 ? (
                            <span className="ml-1 text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Exceeds Limit</span>
                          ) : (
                            <span className="ml-1 text-[9px] text-slate-400 italic">(Set &gt;₹50L)</span>
                          )}
                        </span>
                      </label>

                      {/* Capital Gains Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          id="chk-itr-capgains"
                          type="checkbox"
                          checked={taxData.stcg > 0 || taxData.ltcg > 0}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              setIncomeProfile({ stcg: 45000, ltcg: 165000 });
                            } else {
                              setIncomeProfile({ stcg: 0, ltcg: 0 });
                            }
                          }}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-800 leading-normal">
                          Have <strong>Capital Gains / Loss</strong> (Mutual funds, Stocks, Gold, Property)
                          {taxData.stcg > 0 || taxData.ltcg > 0 ? (
                            <span className="ml-1 text-[9px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Gains Active</span>
                          ) : (
                            <span className="ml-1 text-[9px] text-slate-400 italic">(Activate gains)</span>
                          )}
                        </span>
                      </label>

                      {/* Multiple Houses Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          id="chk-itr-multi-house"
                          type="checkbox"
                          checked={multiHouse}
                          onChange={(e) => setMultiHouse(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-800 leading-normal">
                          Own <strong>more than one</strong> residential house property
                        </span>
                      </label>

                      {/* Foreign Assets Checkbox */}
                      <label className="flex items-start gap-2.5 cursor-pointer group">
                        <input
                          id="chk-itr-foreign"
                          type="checkbox"
                          checked={foreignAssets}
                          onChange={(e) => setForeignAssets(e.target.checked)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-800 leading-normal">
                          Hold company directorship, unlisted shares, or foreign assets
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Assessment Outcome Banner */}
                  <div className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 mt-3 ${
                    formType === 'ITR-2'
                      ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                      : 'bg-blue-50/50 border-blue-100 text-blue-800'
                  }`}>
                    <span className="text-sm">💡</span>
                    <div>
                      {formType === 'ITR-2' ? (
                        <span>
                          <strong>ITR-2 Form Required</strong>: Because of capital gains, high salary limit (&gt;₹50L), or other indicators. TaxSense is fully configured for your interactive ITR-2 schedules review.
                        </span>
                      ) : (
                        <span>
                          <strong>ITR-1 (Sahaj) Eligible</strong>: You are qualified to file return using the simpler Form ITR-1 Sahaj. Let us help you check off the schedules and proceed!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action and official references */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
                  <span className="text-[10px] text-slate-400 font-medium">Source: Income Tax Dept</span>
                  <button
                    id="btn-open-filing-guide-card"
                    onClick={() => setIsFilingGuideOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-bold transition-all cursor-pointer select-none active:scale-95"
                  >
                    <span>Open Filing Checklists</span>
                    <ListTodo className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Portfolio Sync (Left) and Exemption Optimizer (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Portfolio Sync Widget (5 columns) */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <PortfolioSync />
            </div>

            {/* Right: Exemption Optimizer / Deductions Card (7 columns) */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <DeductionCard />
            </div>

          </div>

          {/* Row 3: Tax Regime Comparison (Left) and AI Copilot (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left: Regime Comparison Analysis Panel (7 columns) */}
            <div className="lg:col-span-7 flex flex-col h-full">
              <RegimeComparison />
            </div>

            {/* Right: AI Copilot Chat Interface (5 columns) */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <ChatInterface onFileUpload={handleForm16TextProcessing} />
            </div>

          </div>

          {/* Row 4: Export Section (Bottom final line) */}
          <div className="w-full">
            <ExportControl />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-400 mt-auto shrink-0 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <p>© 2026 TaxSense Inc. | Built for Indian salaried employees under assessment year 2026-27 rules.</p>
        <div className="flex justify-center gap-4 text-slate-500 font-medium">
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy Sandbox</a>
          <span>•</span>
          <a href="#" className="hover:text-blue-600 transition-colors">Sec. 139(1) Filing Guide</a>
          <span>•</span>
          <a href="#" className="hover:text-blue-600 transition-colors">Income Tax Department APIs</a>
        </div>
      </footer>

      <FilingGuide isOpen={isFilingGuideOpen} onClose={() => setIsFilingGuideOpen(false)} />
    </div>
  );
}
