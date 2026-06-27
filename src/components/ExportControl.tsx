import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Copy, 
  Download, 
  Check, 
  FileText, 
  CheckCircle2, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { useTaxStore } from '../store/useTaxStore';
import { calculateTax, formatINR } from '../utils/taxCalculator';
import { TaxData } from '../types';
import { TAX_CONFIG } from '../config';

export default function ExportControl() {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const incomeProfile = useTaxStore((state) => state.incomeProfile);
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);
  const formType = useTaxStore((state) => state.formType);

  // Derive tax input parameters
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
    // Capital Gains
    stcg: incomeProfile.stcg || 0,
    ltcg: incomeProfile.ltcg || 0,
    // Advanced & Portfolio fields
    deduction80CCD1B: confirmedDeductions['80CCD(1B)'] || 0,
    deduction80CCD2: confirmedDeductions['80CCD(2)'] || 0,
    deduction80DD: confirmedDeductions['80DD'] || 0,
    deduction80U: confirmedDeductions['80U'] || 0,
    deduction80DDB: confirmedDeductions['80DDB'] || 0,
    deduction80E: confirmedDeductions['80E'] || 0,
    deduction80EEA: confirmedDeductions['80EEA'] || 0,
    deduction80GG: confirmedDeductions['80GG'] || 0,
    deduction80TTB: confirmedDeductions['80TTB'] || 0,
    deduction80CCH: confirmedDeductions['80CCH'] || 0,
    section24bLetOut: confirmedDeductions['section24bLetOut'] || 0,
  };

  // Run the tax calculations
  const calculation = calculateTax(taxData);
  const { oldRegime, newRegime, recommendedRegime, savings } = calculation;

  const currentRegimeBreakdown = recommendedRegime === 'NEW' ? newRegime : oldRegime;
  const currentStandardDeduction = recommendedRegime === 'NEW' ? TAX_CONFIG.standardDeductionNew : TAX_CONFIG.standardDeductionOld;
  const currentHraExemption = recommendedRegime === 'NEW' ? 0 : taxData.hraExemption;
  const currentNetSalary = Math.max(0, taxData.grossSalary - currentStandardDeduction - currentHraExemption);

  // Map to the requested JSON schema dynamically
  const filingPayload = {
    assessmentYear: TAX_CONFIG.assessmentYear,
    financialYear: TAX_CONFIG.financialYear,
    filingType: formType,
    incomeDetails: {
      grossSalary: taxData.grossSalary,
      standardDeduction: currentStandardDeduction,
      netSalary: currentNetSalary,
      otherIncome: taxData.otherIncome,
      capitalGains: formType === 'ITR-2' ? {
        shortTerm: taxData.stcg,
        longTerm: taxData.ltcg,
        taxableLongTermAfterExemption: Math.max(0, (taxData.ltcg || 0) - 125000)
      } : undefined
    },
    deductionsChapterVIA: recommendedRegime === 'NEW' ? {
      section80CCD2: confirmedDeductions['80CCD(2)'] || 0
    } : {
      section80C: Math.min(150000, taxData.deduction80C),
      section80D: Math.min(75000, taxData.deduction80D),
      sectionHRA: currentHraExemption,
      section80CCD1B: Math.min(50000, confirmedDeductions['80CCD(1B)'] || 0),
      section80CCD2: Math.min(Math.round(taxData.grossSalary * 0.10), confirmedDeductions['80CCD(2)'] || 0),
      section80GG: Math.min(60000, confirmedDeductions['80GG'] || 0),
      section80E: confirmedDeductions['80E'] || 0,
      section80EEA: Math.min(150000, confirmedDeductions['80EEA'] || 0),
      section80TTA: confirmedDeductions['80TTA'] || 0,
      section80TTB: confirmedDeductions['80TTB'] || 0,
      section80DD: Math.min(125000, confirmedDeductions['80DD'] || 0),
      section80U: Math.min(125000, confirmedDeductions['80U'] || 0),
      section80DDB: Math.min(100000, confirmedDeductions['80DDB'] || 0),
      section80G: confirmedDeductions['80G'] || 0,
    },
    taxComputation: {
      totalTaxableIncome: currentRegimeBreakdown.taxableIncome,
      tdsDeducted: taxData.tdsDeducted,
      baseTax: currentRegimeBreakdown.baseTax,
      healthAndEducationCess: currentRegimeBreakdown.cess,
      section87ARebate: currentRegimeBreakdown.rebate87A,
      totalTaxPayable: currentRegimeBreakdown.totalTaxPayable,
      finalTaxPayableOrRefund: currentRegimeBreakdown.refundOrOwed,
      recommendedRegime: recommendedRegime
    }
  };

  const payloadString = JSON.stringify(filingPayload, null, 2);

  // Handle copying JSON to clipboard
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(payloadString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Generate dynamic, beautiful PDF download
  const handleDownloadSummary = () => {
    try {
      const doc = new jsPDF();
      
      // Page styling & layout helper
      const margin = 15;
      let y = 20;
      
      const addLine = (yPos: number) => {
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, yPos, 210 - margin, yPos);
      };
      
      const formatVal = (val: number) => {
        return 'Rs. ' + Math.abs(val).toLocaleString('en-IN');
      };

      // Header block
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(margin, y, 210 - 2 * margin, 24, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TAX-SENSE: TAX FILING SUMMARY', margin + 6, y + 10);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Assessment Year: ${TAX_CONFIG.assessmentYear}  |  Financial Year: ${TAX_CONFIG.financialYear}  |  Form: ${formType}`, margin + 6, y + 17);
      
      y += 34;

      // Recommended Regime Box
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(margin, y, 210 - 2 * margin, 18, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129); // Emerald-500
      doc.text('RECOMMENDATION:', margin + 6, y + 7);
      
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('helvetica', 'normal');
      doc.text(`Filing under the ${recommendedRegime === 'NEW' ? 'NEW TAX REGIME' : 'OLD TAX REGIME'} is optimal. Savings of ${formatVal(savings)} relative to alternate.`, margin + 6, y + 13);
      
      y += 28;

      // Column 1: Item details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Income Profile Summary', margin, y);
      y += 6;
      addLine(y);
      y += 6;

      const items = [
        ['Gross Annual Salary', formatVal(taxData.grossSalary)],
        ['Standard Deduction', formatVal(currentStandardDeduction)],
        ['HRA Exemption', formatVal(currentHraExemption)],
        ['Net Salary Income', formatVal(currentNetSalary)],
        ['Other Sources Income', formatVal(taxData.otherIncome)],
      ];

      if (formType === 'ITR-2') {
        items.push(['Short-Term Cap Gains (STCG)', formatVal(taxData.stcg)]);
        items.push(['Long-Term Cap Gains (LTCG)', formatVal(taxData.ltcg)]);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      for (const item of items) {
        doc.text(item[0], margin + 2, y);
        doc.setFont('helvetica', 'bold');
        doc.text(item[1], 150, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
      }

      y += 5;

      // Section 2: Deductions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Chapter VI-A Deductions Claimed', margin, y);
      y += 6;
      addLine(y);
      y += 6;

      const deductions = [
        ['Section 80C (PPF, EPF, ELSS, principal loan)', formatVal(filingPayload.deductionsChapterVIA.section80C || 0)],
        ['Section 80D (Health Insurance Premium)', formatVal(filingPayload.deductionsChapterVIA.section80D || 0)],
        ['Section 10(13A) HRA Exemption', formatVal(filingPayload.deductionsChapterVIA.sectionHRA || 0)],
        ['Section 80CCD(1B) Standalone Employee NPS', formatVal(filingPayload.deductionsChapterVIA.section80CCD1B || 0)],
        ['Section 80CCD(2) Employer NPS Contribution', formatVal(filingPayload.deductionsChapterVIA.section80CCD2 || 0)],
        ['Section 80GG (Rent Paid)', formatVal(filingPayload.deductionsChapterVIA.section80GG || 0)],
        ['Section 80E (Education Loan Interest)', formatVal(filingPayload.deductionsChapterVIA.section80E || 0)],
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      for (const item of deductions) {
        if (parseFloat(item[1].replace(/[^0-9]/g, '')) > 0) {
          doc.text(item[0], margin + 2, y);
          doc.setFont('helvetica', 'bold');
          doc.text(item[1], 150, y);
          doc.setFont('helvetica', 'normal');
          y += 7;
        }
      }

      y += 5;

      // Section 3: Tax Payable / Refund
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Tax Computation & Reconciliation', margin, y);
      y += 6;
      addLine(y);
      y += 6;

      const comp = [
        ['Total Taxable Income', formatVal(currentRegimeBreakdown.taxableIncome)],
        ['Calculated Base Tax', formatVal(currentRegimeBreakdown.baseTax)],
        ['Section 87A Rebate', formatVal(currentRegimeBreakdown.rebate87A)],
        ['Health & Cess (4%)', formatVal(currentRegimeBreakdown.cess)],
        ['Total Tax Liability', formatVal(currentRegimeBreakdown.totalTaxPayable)],
        ['TDS Deposited / Paid', formatVal(taxData.tdsDeducted)],
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);

      for (const item of comp) {
        doc.text(item[0], margin + 2, y);
        doc.setFont('helvetica', 'bold');
        doc.text(item[1], 150, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
      }

      y += 3;
      addLine(y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      
      const balanceValue = currentRegimeBreakdown.refundOrOwed;
      if (balanceValue <= 0) {
        doc.setTextColor(16, 185, 129); // Green
        doc.text('FINAL STATUS: REFUND DUE', margin + 2, y);
        doc.text(formatVal(balanceValue), 150, y);
      } else {
        doc.setTextColor(220, 38, 38); // Red
        doc.text('FINAL STATUS: TAX PAYABLE / OWED', margin + 2, y);
        doc.text(formatVal(balanceValue), 150, y);
      }

      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(`Report generated via TaxSense ITR Copilot on ${new Date().toLocaleString()}`, margin, y);
      doc.text('Disclaimer: This is a smart tax filing projection based on user inputs. Verify all schedules before final submission.', margin, y + 4);

      doc.save(`TaxSense_${formType}_Summary_${taxData.grossSalary}.pdf`);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    }
  };



  return (
    <div 
      id="export-hub-container" 
      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-slate-800 transition-all duration-300"
    >
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Filing Export Hub</h3>
            <p className="text-[10px] text-slate-400 font-medium">Export returns & trigger reminders</p>
          </div>
        </div>
        <span className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
          {formType} Active
        </span>
      </div>

      {/* Recommended Route Summary */}
      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommendation</span>
          <p className="text-xs font-bold text-slate-800">
            {recommendedRegime === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
            Saves ₹{savings.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Document Options & JSON Copy Row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Save Summary & Print Report */}
        <div className="border border-slate-150 rounded-xl p-3 bg-white space-y-2 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Download className="h-3 w-3 text-blue-500" />
            <span>ITR Exports</span>
          </div>
          
          <div className="flex">
            {/* Download Text Summary */}
            <button
              id="btn-download-summary"
              onClick={handleDownloadSummary}
              className={`w-full h-8 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 border ${
                downloaded
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {downloaded ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 text-slate-400" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* JSON Payload Copy Box */}
        <div className="border border-slate-150 rounded-xl p-3 bg-white space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>ITR Schema</span>
            </div>
            
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-[9px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              {showRawJson ? 'Hide' : 'Preview'}
            </button>
          </div>

          {/* Copy Button */}
          <button
            id="btn-copy-itr1-json"
            onClick={handleCopyJSON}
            className={`w-full h-8 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-white animate-pulse" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showRawJson && (
        <div 
          id="preview-json-payload"
          className="border border-slate-200 rounded-lg p-2.5 bg-slate-950 font-mono text-[9px] text-emerald-400 leading-relaxed max-h-32 overflow-y-auto select-all"
        >
          <pre>{payloadString}</pre>
        </div>
      )}



      {/* Hidden Print-Only Layout Integration */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-section, #print-section * {
            visibility: visible !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Hidden Print-Only Tax Statement Report */}
      <div id="print-section" className="hidden font-sans p-10 max-w-4xl mx-auto bg-white text-slate-900 leading-relaxed">
        {/* Header Block */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">TAX-SENSE</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Official Session Summary Report</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white font-mono text-[10px] font-bold px-3 py-1 rounded">
              AY 2026-27 (FY 2025-26)
            </span>
            <p className="text-[9px] text-slate-400 font-mono mt-1">Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Executive summary block */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Filing Path Route</p>
            <p className="text-sm font-extrabold text-slate-800">
              {formType} under {recommendedRegime === 'NEW' ? 'New Tax Regime (Optimal)' : 'Old Tax Regime (Optimal)'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Tax Saved</p>
            <p className="text-sm font-extrabold text-emerald-600">
              ₹{savings.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Detailed Financial Breakdown Tables */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-250 pb-1.5 mb-3">
              1. Income Details
            </h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2">Line Item Description</th>
                  <th className="py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5">Gross Annual Salary</td>
                  <td className="py-2.5 text-right font-mono">{taxData.grossSalary.toLocaleString('en-IN')}</td>
                </tr>
                {formType === 'ITR-2' && (
                  <>
                    <tr>
                      <td className="py-2.5">Short-Term Capital Gains (STCG)</td>
                      <td className="py-2.5 text-right font-mono">{taxData.stcg.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold">Long-Term Capital Gains (LTCG)</td>
                      <td className="py-2.5 text-right font-mono font-semibold">{taxData.ltcg.toLocaleString('en-IN')}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="py-2.5">Standard Deduction</td>
                  <td className="py-2.5 text-right font-mono text-slate-500">-{currentStandardDeduction.toLocaleString('en-IN')}</td>
                </tr>
                {currentHraExemption > 0 && (
                  <tr>
                    <td className="py-2.5">HRA Exemption (Section 10(13A))</td>
                    <td className="py-2.5 text-right font-mono text-slate-500">-{currentHraExemption.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                <tr className="font-semibold text-slate-900 bg-slate-50/50">
                  <td className="py-2.5">Net Salary Income</td>
                  <td className="py-2.5 text-right font-mono">{currentNetSalary.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5">Income from Other Sources (FD Interest, etc.)</td>
                  <td className="py-2.5 text-right font-mono">{taxData.otherIncome.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-250 pb-1.5 mb-3">
              2. Chapter VI-A Deductions
            </h3>
            {recommendedRegime === 'NEW' ? (
              <p className="text-xs text-slate-500 italic">No deductions are permitted under the simplified New Tax Regime (except 80CCD(2) if applicable).</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                    <th className="py-2">Section Reference</th>
                    <th className="py-2 text-right">Deducted (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {taxData.deduction80C > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans">Section 80C (PPF, EPF, LIC, ELSS, etc.)</td>
                      <td className="py-2.5 text-right">{Math.min(150000, taxData.deduction80C).toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {taxData.deduction80D > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans">Section 80D (Medical Insurance Premium)</td>
                      <td className="py-2.5 text-right">{Math.min(75000, taxData.deduction80D).toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {confirmedDeductions['80CCD(1B)'] > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans">Section 80CCD(1B) (Additional NPS)</td>
                      <td className="py-2.5 text-right">{Math.min(50000, confirmedDeductions['80CCD(1B)']).toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {confirmedDeductions['80GG'] > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans">Section 80GG (Rent Paid)</td>
                      <td className="py-2.5 text-right">{Math.min(60000, confirmedDeductions['80GG']).toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  {taxData.deduction80TTA > 0 && (
                    <tr>
                      <td className="py-2.5 font-sans">Section 80TTA (Savings Bank Interest Exemption)</td>
                      <td className="py-2.5 text-right">{taxData.deduction80TTA.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-250 pb-1.5 mb-3">
              3. Tax Computation & Liability
            </h3>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2">Line Item</th>
                  <th className="py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                <tr>
                  <td className="py-2.5 font-sans text-slate-900 font-semibold">Total Taxable Income</td>
                  <td className="py-2.5 text-right font-bold text-slate-900">{currentRegimeBreakdown.taxableIncome.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-sans">Calculated Base Tax</td>
                  <td className="py-2.5 text-right">{currentRegimeBreakdown.baseTax.toLocaleString('en-IN')}</td>
                </tr>
                {currentRegimeBreakdown.rebate87A > 0 && (
                  <tr>
                    <td className="py-2.5 font-sans text-emerald-600 font-medium">Section 87A Rebate</td>
                    <td className="py-2.5 text-right text-emerald-600">-{currentRegimeBreakdown.rebate87A.toLocaleString('en-IN')}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2.5 font-sans">Health & Education Cess (4%)</td>
                  <td className="py-2.5 text-right">{currentRegimeBreakdown.cess.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-t-2 border-slate-300 font-bold text-slate-900 bg-slate-50">
                  <td className="py-2.5 font-sans">Total Gross Tax Payable</td>
                  <td className="py-2.5 text-right">{currentRegimeBreakdown.totalTaxPayable.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-sans text-blue-600">Total TDS Deposited (per Form 16 / AIS)</td>
                  <td className="py-2.5 text-right text-blue-600">-{taxData.tdsDeducted.toLocaleString('en-IN')}</td>
                </tr>
                <tr className={`border-t-2 border-slate-900 font-black text-xs ${
                  currentRegimeBreakdown.refundOrOwed <= 0 ? 'text-emerald-700' : 'text-amber-800'
                }`}>
                  <td className="py-3 font-sans uppercase tracking-wider">
                    {currentRegimeBreakdown.refundOrOwed <= 0 ? 'Net Refund Owed to You ✓' : 'Net Tax Balance Payable to Gov ⚠'}
                  </td>
                  <td className="py-3 text-right text-sm">
                    ₹{Math.abs(currentRegimeBreakdown.refundOrOwed).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer / Sign block */}
        <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-[10px] text-slate-400 leading-normal">
          <div>
            <p className="font-bold text-slate-500 uppercase tracking-wider mb-1">System Declaration</p>
            <p>
              This is an auto-generated computational summary based entirely on data supplied by the session operator. 
              The algorithms adhere precisely to standard Indian tax schedules for AY 2026-27.
            </p>
          </div>
          <div className="flex flex-col justify-end items-end">
            <div className="w-32 border-b border-slate-300 h-8 mb-1"></div>
            <p className="font-bold text-slate-500 uppercase tracking-wider">Operator Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
