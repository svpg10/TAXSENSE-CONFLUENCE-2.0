import React from 'react';
import { useTaxStore } from '../store/useTaxStore';
import { TaxData } from '../types';
import { formatINR } from '../utils/taxCalculator';
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Building, 
  Coins, 
  Receipt, 
  ShieldCheck, 
  TrendingUp,
  HelpCircle
} from 'lucide-react';

interface ExtractionConfirmProps {
  extractedData: Partial<TaxData> | null;
  onConfirm: (confirmedData: TaxData) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export default function ExtractionConfirm({
  extractedData,
  onConfirm,
  onCancel,
  isProcessing,
}: ExtractionConfirmProps) {
  // Grab state and setters from our Zustand store
  const storeIncomeProfile = useTaxStore((state) => state.incomeProfile);
  const storeConfirmedDeductions = useTaxStore((state) => state.confirmedDeductions);
  const setIncomeProfile = useTaxStore((state) => state.setIncomeProfile);
  const updateDeduction = useTaxStore((state) => state.updateDeduction);
  const setStep = useTaxStore((state) => state.setStep);

  // Initialize interactive local state with parsed data falling back to store values
  const [employerName, setEmployerName] = React.useState<string>(
    extractedData?.employerName || storeIncomeProfile.employerName || ''
  );
  const [grossSalary, setGrossSalary] = React.useState<number>(
    extractedData?.grossSalary ?? storeIncomeProfile.grossSalary ?? 0
  );
  const [tdsDeducted, setTdsDeducted] = React.useState<number>(
    extractedData?.tdsDeducted ?? storeIncomeProfile.tdsDeducted ?? 0
  );
  const [pfContribution, setPfContribution] = React.useState<number>(
    extractedData?.pfContribution ?? storeIncomeProfile.pfContribution ?? 0
  );
  const [hraReceived, setHraReceived] = React.useState<number>(
    extractedData?.hraExemption ?? storeIncomeProfile.hraReceived ?? 0
  );

  // Optional secondary fields for high User Agency
  const [otherIncome, setOtherIncome] = React.useState<number>(
    extractedData?.otherIncome ?? storeIncomeProfile.otherIncome ?? 0
  );
  const [deduction80C, setDeduction80C] = React.useState<number>(
    extractedData?.deduction80C ?? storeConfirmedDeductions['80C'] ?? 0
  );
  const [deduction80D, setDeduction80D] = React.useState<number>(
    extractedData?.deduction80D ?? storeConfirmedDeductions['80D'] ?? 0
  );
  const [deduction80CCD1B, setDeduction80CCD1B] = React.useState<number>(
    extractedData?.deduction80CCD1B ?? storeConfirmedDeductions['80CCD(1B)'] ?? 0
  );
  const [deduction80E, setDeduction80E] = React.useState<number>(
    extractedData?.deduction80E ?? storeConfirmedDeductions['80E'] ?? 0
  );
  const [deduction80G, setDeduction80G] = React.useState<number>(
    extractedData?.deduction80G ?? storeConfirmedDeductions['80G'] ?? 0
  );
  const [deduction80TTA, setDeduction80TTA] = React.useState<number>(
    extractedData?.deduction80TTA ?? storeConfirmedDeductions['80TTA'] ?? 0
  );
  const [section24b, setSection24b] = React.useState<number>(
    extractedData?.section24b ?? storeConfirmedDeductions['section24b'] ?? 0
  );
  const [basicSalary, setBasicSalary] = React.useState<number>(
    extractedData?.basicSalary ?? storeIncomeProfile.basicSalary ?? Math.round(grossSalary * 0.4)
  );

  // Validation Flags for Smart Error & Missing Data Highlighting
  const isGrossSalaryEmpty = grossSalary === null || grossSalary === undefined || grossSalary === 0;
  const isTdsDeductedEmpty = tdsDeducted === null || tdsDeducted === undefined || tdsDeducted === 0;
  const isEmployerNameEmpty = !employerName || employerName.trim() === '';
  const isPfContributionEmpty = pfContribution === null || pfContribution === undefined || pfContribution === 0;
  const isHraReceivedEmpty = hraReceived === null || hraReceived === undefined || hraReceived === 0;

  // Let the user know if critical fields are zero or blank
  const hasCriticalWarning = isGrossSalaryEmpty || isTdsDeductedEmpty;

  // Clean numeric change handler with local string formatting support
  const handleNumericStateChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    val: string
  ) => {
    const cleaned = parseInt(val.replace(/[^0-9]/g, '')) || 0;
    setter(Math.max(0, cleaned));
  };

  const handleApply = () => {
    // Numeric validation routine
    if (isNaN(grossSalary) || isNaN(tdsDeducted) || isNaN(pfContribution) || isNaN(hraReceived) || isNaN(otherIncome)) {
      alert('Please fill in valid numerical values before finalizing.');
      return;
    }

    // Build the confirmed complete TaxData structure
    const confirmedData: TaxData = {
      assessmentYear: extractedData?.assessmentYear || '2026-27',
      grossSalary,
      hraExemption: hraReceived,
      ltaExemption: extractedData?.ltaExemption || 0,
      standardDeductionOld: 50000,
      standardDeductionNew: 75000,
      otherIncome,
      deduction80C: deduction80C > 0 ? deduction80C : pfContribution, // fallback to PF if 80C not explicitly filled
      deduction80D,
      deduction80TTA: deduction80TTA > 0 ? deduction80TTA : Math.min(10000, otherIncome),
      deduction80CCD1B,
      deduction80E,
      deduction80G,
      section24b,
      tdsDeducted,
      employerName: employerName || 'Not Declared',
      pfContribution
    };

    // 1. Commit values to Zustand store's incomeProfile
    setIncomeProfile({
      grossSalary,
      tdsDeducted,
      basicSalary,
      hraReceived,
      otherIncome,
      employerName: employerName || 'Not Declared',
      pfContribution
    });

    // 2. Commit core deductions to keep entire app synchronous
    updateDeduction('80C', deduction80C > 0 ? deduction80C : pfContribution);
    updateDeduction('80D', deduction80D);
    updateDeduction('HRA exemption', hraReceived);
    updateDeduction('80CCD(1B)', deduction80CCD1B);
    updateDeduction('80E', deduction80E);
    updateDeduction('80G', deduction80G);
    updateDeduction('80TTA', deduction80TTA > 0 ? deduction80TTA : Math.min(10000, otherIncome));
    updateDeduction('section24b', section24b);

    // 3. Advance Step State to conversant copilot mode
    setStep('CHAT_QA');

    // 4. Trigger parent callback to process UI actions and greeting
    onConfirm(confirmedData);
  };

  // Live Math calculation for Snapshot card
  const standardDeductionOld = 50000;
  const standardDeductionNew = 75000;
  const netTaxableSalaryOld = Math.max(0, grossSalary - standardDeductionOld);
  const netTaxableSalaryNew = Math.max(0, grossSalary - standardDeductionNew);

  if (isProcessing) {
    return (
      <div id="extraction-loading-state" className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Analyzing Form 16 Structure</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm font-medium leading-relaxed">
          Gemini is parsing the salary structure, standard deductions, Section 80C investments, and TDS details from your document...
        </p>
      </div>
    );
  }

  return (
    <div id="extraction-confirm-card" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-md text-slate-800 animate-fade-in">
      {/* Header Info Block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Form 16 Extraction Verification</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verify values extracted by Gemini AI. Keep editing any fields to correct errors before starting.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-3.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full">
          AY {extractedData?.assessmentYear || '2026-27'}
        </span>
      </div>

      {/* Warning/Action Required Callout */}
      {hasCriticalWarning && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-amber-900">Manual verification required</h5>
            <p className="text-[11px] leading-relaxed">
              Our Form 16 AI extractor identified some missing, unreadable, or zero fields in your document. Please verify and manually input your correct <strong>Gross Salary</strong> and <strong>TDS</strong> values in the highlighted fields below.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Rows */}
      <div className="space-y-5">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-2">
          AI Extracted Parameters vs Manual Corrections
        </h4>

        {/* 1. Employer Name Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Employer Name</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">Company name listed on your Form 16 Annexure</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">AI Extracted:</span>
              {extractedData?.employerName ? (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  "{extractedData.employerName}"
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Not detected
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-7">
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              className={`w-full bg-slate-50 border rounded-xl py-2 px-3.5 text-sm text-slate-800 focus:outline-none focus:bg-white transition-all ${
                isEmployerNameEmpty ? 'border-amber-400/50 bg-amber-50/10' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="Enter employer company name"
            />
            {isEmployerNameEmpty && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50/40 border border-amber-100 px-2 py-0.5 rounded-md mt-1.5">
                ⚠️ Action Required: Please fill manually
              </span>
            )}
          </div>
        </div>

        {/* 2. Gross Salary Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Gross Salary (Section 17)</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">Annual base pay inclusive of allowances and taxable perks</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">AI Extracted:</span>
              {extractedData?.grossSalary ? (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  {formatINR(extractedData.grossSalary)}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Not detected
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
              <input
                type="text"
                value={grossSalary ? grossSalary.toLocaleString('en-IN') : ''}
                onChange={(e) => handleNumericStateChange(setGrossSalary, e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl py-2 pl-8 pr-3.5 text-sm text-slate-800 font-mono focus:outline-none focus:bg-white transition-all ${
                  isGrossSalaryEmpty ? 'border-amber-500/50 ring-1 ring-amber-500/10 bg-amber-50/10' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="Enter annual gross salary"
              />
            </div>
            {isGrossSalaryEmpty && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md mt-1.5">
                ⚠️ Action Required: Please fill manually
              </span>
            )}
          </div>
        </div>

        {/* 3. TDS Deducted Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">TDS Deducted (Sec 192)</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">Total income tax deposited on your behalf by your employer</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">AI Extracted:</span>
              {extractedData?.tdsDeducted ? (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  {formatINR(extractedData.tdsDeducted)}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Not detected
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
              <input
                type="text"
                value={tdsDeducted ? tdsDeducted.toLocaleString('en-IN') : ''}
                onChange={(e) => handleNumericStateChange(setTdsDeducted, e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl py-2 pl-8 pr-3.5 text-sm text-slate-800 font-mono focus:outline-none focus:bg-white transition-all ${
                  isTdsDeductedEmpty ? 'border-amber-500/50 ring-1 ring-amber-500/10 bg-amber-50/10' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="Enter tax deducted at source"
              />
            </div>
            {isTdsDeductedEmpty && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md mt-1.5">
                ⚠️ Action Required: Please fill manually
              </span>
            )}
          </div>
        </div>

        {/* 4. PF Contribution Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">PF Contribution (80C Eligible)</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">Employee Provident Fund deducted from your base pay (annualized)</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">AI Extracted:</span>
              {extractedData?.deduction80C ? (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  {formatINR(extractedData.deduction80C)}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Not detected
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
              <input
                type="text"
                value={pfContribution ? pfContribution.toLocaleString('en-IN') : ''}
                onChange={(e) => handleNumericStateChange(setPfContribution, e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl py-2 pl-8 pr-3.5 text-sm text-slate-800 font-mono focus:outline-none focus:bg-white transition-all ${
                  isPfContributionEmpty ? 'border-slate-200 focus:border-blue-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="Enter provident fund amount"
              />
            </div>
            {isPfContributionEmpty && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md mt-1.5">
                ⚠️ Action Required: Please fill manually
              </span>
            )}
          </div>
        </div>

        {/* 5. HRA Received Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">HRA Received (Section 10(13A))</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">House Rent Allowance component specified in salary breakdown</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">AI Extracted:</span>
              {extractedData?.hraExemption ? (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-mono">
                  {formatINR(extractedData.hraExemption)}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Not detected
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
              <input
                type="text"
                value={hraReceived ? hraReceived.toLocaleString('en-IN') : ''}
                onChange={(e) => handleNumericStateChange(setHraReceived, e.target.value)}
                className={`w-full bg-slate-50 border rounded-xl py-2 pl-8 pr-3.5 text-sm text-slate-800 font-mono focus:outline-none focus:bg-white transition-all ${
                  isHraReceivedEmpty ? 'border-slate-200 focus:border-blue-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="Enter HRA received from employer"
              />
            </div>
            {isHraReceivedEmpty && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md mt-1.5">
                ⚠️ Action Required: Please fill manually
              </span>
            )}
          </div>
        </div>

        {/* Additional Optional Section for full control */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 space-y-4">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Secondary Adjustments</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Other Income</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={otherIncome ? otherIncome.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setOtherIncome, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Deduction 80C</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={deduction80C ? deduction80C.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setDeduction80C, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Deduction 80D</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={deduction80D ? deduction80D.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setDeduction80D, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Basic Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={basicSalary ? basicSalary.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setBasicSalary, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">NPS (80CCD(1B))</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={deduction80CCD1B ? deduction80CCD1B.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setDeduction80CCD1B, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Edu Loan (80E)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={deduction80E ? deduction80E.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setDeduction80E, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Donations (80G)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={deduction80G ? deduction80G.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setDeduction80G, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Savings Int (80TTA)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={deduction80TTA ? deduction80TTA.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setDeduction80TTA, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Home Loan Int (24b)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-[11px] font-semibold">₹</span>
                <input
                  type="text"
                  value={section24b ? section24b.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleNumericStateChange(setSection24b, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-6 pr-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Mathematical Verification Preview */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md mt-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Mathematical Verification Snapshot</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Old Regime Card */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Old Tax Regime</span>
              <div className="text-base font-black text-white mt-1 font-mono">
                {formatINR(netTaxableSalaryOld)}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-700/40 pt-2 flex justify-between">
              <span>Standard Deduction:</span>
              <span className="font-mono text-slate-300">-{formatINR(standardDeductionOld)}</span>
            </div>
          </div>

          {/* New Regime Card */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">New Tax Regime</span>
              <div className="text-base font-black text-blue-100 mt-1 font-mono">
                {formatINR(netTaxableSalaryNew)}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 border-t border-slate-700/40 pt-2 flex justify-between">
              <span>Standard Deduction:</span>
              <span className="font-mono text-blue-300">-{formatINR(standardDeductionNew)}</span>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 mt-3 text-center leading-normal">
          Net Taxable Salary = Gross Salary - Standard Deduction. Adjusting the inputs above will immediately update these values.
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100 pt-5 mt-6">
        <button
          id="btn-cancel-extraction"
          onClick={onCancel}
          type="button"
          className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors text-center active:scale-98"
        >
          Cancel
        </button>
        <button
          id="btn-confirm-extraction"
          onClick={handleApply}
          type="button"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all active:scale-98"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Confirm & Start Chat Copilot</span>
        </button>
      </div>
    </div>
  );
}
