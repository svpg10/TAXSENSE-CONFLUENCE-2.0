import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Calendar, 
  CheckCircle2, 
  HelpCircle, 
  FileText,
  AlertTriangle,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { useTaxStore } from '../store/useTaxStore';
import { formatINR } from '../utils/taxCalculator';

type ActiveInfoTab = 'slabs' | 'itr1' | 'checklist' | 'deadlines';

export default function GuidelinesInfoBar() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveInfoTab>('slabs');
  
  const incomeProfile = useTaxStore((state) => state.incomeProfile);
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);

  // Check ITR-1 Eligibility flags dynamically
  const totalIncome = (incomeProfile.grossSalary || 0) + (incomeProfile.otherIncome || 0);
  const hasCapitalGains = (incomeProfile.stcg || 0) > 0 || (incomeProfile.ltcg || 0) > 0;
  const multiHouse = useTaxStore((state) => state.multiHouse);
  const foreignAssets = useTaxStore((state) => state.foreignAssets);

  let eligibilityWarning = '';
  if (totalIncome > 5000000) {
    eligibilityWarning = 'Your total gross income exceeds ₹50 Lakhs. You are ineligible for ITR-1 (Sahaj) and must file ITR-2.';
  } else if (hasCapitalGains) {
    eligibilityWarning = 'You have active short-term or long-term capital gains in your profile. Capital gains require filing ITR-2 instead of ITR-1.';
  } else if (multiHouse) {
    eligibilityWarning = 'You have selected multi-house properties. ITR-1 only supports a maximum of one house property. You must file ITR-2.';
  } else if (foreignAssets) {
    eligibilityWarning = 'You have foreign assets or foreign income. This requires filing ITR-2 or ITR-3.';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50 px-5 py-3.5 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              TaxSense Guidelines & Interactive Info Hub
              <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded-full lowercase normal-case tracking-normal">FY 2025-26 guidelines</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Click to expand or collapse standard slab guides, document checklists, and eligibility logs</p>
          </div>
        </div>
        <div className="text-slate-400 hover:text-slate-600">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expandable Tabs Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-150"
          >
            {/* Tab select bar */}
            <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('slabs')}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'slabs' 
                    ? 'bg-white text-blue-700 shadow-3xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Slab Surcharges (FY 2025-26)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('itr1')}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'itr1' 
                    ? 'bg-white text-blue-700 shadow-3xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                ITR-1 Eligibility Auditor
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'checklist' 
                    ? 'bg-white text-blue-700 shadow-3xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Form 16 Verification Checklist
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deadlines')}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'deadlines' 
                    ? 'bg-white text-blue-700 shadow-3xs border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Filing Timeline & Deadlines
              </button>
            </div>

            {/* Tab detail viewport */}
            <div className="p-4.5 bg-white text-slate-800 leading-normal text-xs">
              <AnimatePresence mode="wait">
                {activeTab === 'slabs' && (
                  <motion.div
                    key="slabs"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  >
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2.5 text-blue-600 flex items-center gap-1">
                        🌟 New Regime Slabs (Default for FY 2025-26)
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                        Under Union Budget 2025 (AY 2026-27), slabs have been widened and standard deduction is upgraded to <strong>₹75,000</strong>. Income up to <strong>₹7,00,000</strong> has complete rebate under Section 87A (resulting in zero tax!).
                      </p>
                      <div className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden font-mono text-[10.5px]">
                        <div className="grid grid-cols-2 bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-200">
                          <span>Income Bracket</span>
                          <span className="text-right">Tax Rate</span>
                        </div>
                        <div className="divide-y divide-slate-150">
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>Up to ₹4 Lakhs</span><span className="text-right font-bold text-emerald-600">Nil</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹4 Lakhs to ₹8 Lakhs</span><span className="text-right font-bold">5%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹8 Lakhs to ₹12 Lakhs</span><span className="text-right font-bold">10%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹12 Lakhs to ₹16 Lakhs</span><span className="text-right font-bold">15%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹16 Lakhs to ₹20 Lakhs</span><span className="text-right font-bold">20%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹20 Lakhs to ₹24 Lakhs</span><span className="text-right font-bold">25%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>Above ₹24 Lakhs</span><span className="text-right font-bold">30%</span></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2.5 text-amber-600 flex items-center gap-1">
                        🏛️ Old Regime Slabs (Optional Opt-out)
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                        Allows Chapter VI-A deductions (EPF, PPF, Section 80C, 80D) and HRA/rent exemptions. Standard deduction is capped at <strong>₹50,000</strong>. Income up to <strong>₹5,000,000</strong> is completely tax-free via Section 87A rebate.
                      </p>
                      <div className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden font-mono text-[10.5px]">
                        <div className="grid grid-cols-2 bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-200">
                          <span>Income Bracket</span>
                          <span className="text-right">Tax Rate</span>
                        </div>
                        <div className="divide-y divide-slate-150">
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>Up to ₹2.5 Lakhs</span><span className="text-right font-bold text-emerald-600">Nil</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹2.5 Lakhs to ₹5 Lakhs</span><span className="text-right font-bold">5%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>₹5 Lakhs to ₹10 Lakhs</span><span className="text-right font-bold">20%</span></div>
                          <div className="grid grid-cols-2 px-3 py-1.5"><span>Above ₹10 Lakhs</span><span className="text-right font-bold">30%</span></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'itr1' && (
                  <motion.div
                    key="itr1"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <h4 className="font-bold text-slate-800 uppercase tracking-wide">ITR-1 (Sahaj) Eligibility Rules</h4>
                    </div>

                    {eligibilityWarning ? (
                      <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl text-rose-800 flex gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                        <div>
                          <strong className="block text-[11px] uppercase tracking-wide mb-0.5">Eligibility Audit: Ineligible for ITR-1</strong>
                          <p className="text-[10px] font-medium leading-relaxed">{eligibilityWarning}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                        <div>
                          <strong className="block text-[11px] uppercase tracking-wide mb-0.5">Eligibility Audit: Eligible for ITR-1 (Sahaj)</strong>
                          <p className="text-[10px] font-medium leading-relaxed">
                            Excellent! Based on your current settings (Total gross income is {formatINR(totalIncome)}, no active capital gains logs, single house property, and no foreign assets), you fit the criteria for filing ITR-1 (Sahaj).
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px]">
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1.5">
                        <strong className="text-slate-700 block border-b border-slate-200 pb-1">✅ WHO CAN FILE ITR-1:</strong>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          <li>Resident individuals whose total annual income is under <strong>₹50 Lakhs</strong>.</li>
                          <li>Income source restricted to <strong>Salary, One House Property, and Other Interest Sources</strong>.</li>
                          <li>Agricultural income up to ₹5,000.</li>
                        </ul>
                      </div>
                      <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-1.5">
                        <strong className="text-rose-800 block border-b border-rose-100 pb-1">❌ WHO CANNOT FILE ITR-1 (Sahaj):</strong>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          <li>Non-residents (NRI) or Resident Not Ordinarily Resident (RNOR) individuals.</li>
                          <li>Individuals with income from <strong>Business, Profession, or Capital Gains (STCG/LTCG)</strong>.</li>
                          <li>Individuals owning <strong>more than one house property</strong>.</li>
                          <li>Individuals having foreign assets, foreign bank accounts, or signee authorities.</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'checklist' && (
                  <motion.div
                    key="checklist"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-4.5"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Form 16 Cross-Verification Steps
                      </h4>
                      <p className="text-[10px] text-slate-500 mb-3">
                        When you upload or parse your Form 16, make sure to cross-verify the following items against the values in your TRACES Form 26AS or portal's AIS statement to avoid tax notices.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">1. Check Part A (TDS)</span>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Verify the Quarter-wise TDS deducted by your employer. Ensure the <strong>TAN</strong> of your employer is accurately parsed; it must match your Form 26AS entries on Traces portal.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">2. Check Part B (Salary details)</span>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Compare the <strong>Gross Salary (u/s 17(1))</strong> and any allowances under Section 10 (like House Rent Allowance, LTA) with the pre-filled fields in the TaxSense panel.
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">3. Verify Chapter VI-A Deductions</span>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          Confirm that your retirement savings (EPF/NPS/PPF), health policies (80D), and interest deductions have been factored in. Any missed deduction can be claimed directly in our Optimizer!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'deadlines' && (
                  <motion.div
                    key="deadlines"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                  >
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Official Filing Milestones & Dates
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Filing your ITR-1 Sahaj after the deadline triggers late-filing fees under Section 234F. If your total income is under ₹5 Lakhs, the late fee is ₹1,000; otherwise, the fee is ₹5,000.
                      </p>
                      <div className="bg-slate-50 rounded-xl border border-slate-150 p-3 text-[10.5px] leading-normal text-slate-600">
                        🚨 <strong>Pro-Tip on Double-Deduction Audits:</strong> Keep proof receipts of HRA, rent payments, and medical claims (Section 80D) ready in your records for at least 6 financial years. The department conducts AI-driven automated screening on claims exceeding 30% of gross total salary.
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ITR Filing Due Date</span>
                        <strong className="text-xl font-black text-rose-600 block">July 31, 2026</strong>
                        <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight">For FY 2025-26 (AY 2026-27)</span>
                      </div>

                      <div className="border-t border-slate-200 pt-2.5 mt-2">
                        <a 
                          href="https://www.incometax.gov.in/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          Official Income Tax Portal <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
