import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  BookOpen, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  ChevronRight,
  RefreshCw,
  Award,
  Sparkles
} from 'lucide-react';
import { useTaxStore } from '../store/useTaxStore';

interface FilingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  officialRef?: string;
  officialUrl?: string;
}

interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
}

const ITR1_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'prep',
    name: '1. Pre-requisites & Documents',
    description: 'Collect all mandatory tax certificates and match them against official records before initiating filing.',
    items: [
      {
        id: 'pan_aadhaar',
        title: 'Link PAN with Aadhaar',
        description: 'Verify PAN-Aadhaar linking status on the e-filing portal. Inoperative PANs cannot receive refunds or file returns.',
        officialRef: 'Sec 139AA of IT Act',
        officialUrl: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/link-aadhaar-status'
      },
      {
        id: 'collect_docs',
        title: 'Download Form 16, Form 26AS & AIS',
        description: 'Download Form 16 from your employer, and retrieve Form 26AS (Tax Credit Statement) & AIS (Annual Information Statement) from the portal to confirm all TDS amounts match.',
        officialRef: 'Form 16 / AIS Portal',
        officialUrl: 'https://eportal.incometax.gov.in/'
      },
      {
        id: 'bank_preval',
        title: 'Validate Active Bank Account',
        description: 'Ensure at least one bank account is active and pre-validated on the e-filing portal for secure, direct refund credit.',
        officialRef: 'My Bank Accounts Section',
        officialUrl: 'https://eportal.incometax.gov.in/'
      }
    ]
  },
  {
    id: 'portal',
    name: '2. Portal Entry & Form Selection',
    description: 'Log in to the income tax return e-filing platform and select the appropriate return form.',
    items: [
      {
        id: 'portal_login',
        title: 'Login to e-Filing Portal',
        description: 'Visit incometax.gov.in and log in using your PAN/Aadhaar and secure password credential.',
        officialUrl: 'https://eportal.incometax.gov.in/'
      },
      {
        id: 'start_filing',
        title: 'Initiate Return Filing Flow',
        description: 'Go to "e-File" > "Income Tax Returns" > "File Income Tax Return". Select Assessment Year 2026-27 (Financial Year 2025-26), Online Mode, and Individual Status.',
        officialRef: 'AY 2026-27'
      },
      {
        id: 'select_itr1',
        title: 'Select ITR-1 (Sahaj)',
        description: 'Confirm selection of ITR-1. Only applicable for resident individuals with total income up to ₹50 Lakhs from Salary, One House Property, and Other Sources.',
        officialRef: 'ITR-1 Eligibility Guidelines'
      }
    ]
  },
  {
    id: 'schedules',
    name: '3. Verify Pre-filled Schedules',
    description: 'Review and confirm the 5 core pre-filled data schedules as calculated by TaxSense.',
    items: [
      {
        id: 'sched_personal',
        title: 'Schedule: Personal Information',
        description: 'Verify your name, Aadhaar, address, contact details, and bank account selected for refund. Select "Section 139(1)" (Filing on or before due date).',
        officialRef: 'Personal Info Schedule'
      },
      {
        id: 'sched_income',
        title: 'Schedule: Gross Total Income',
        description: 'Match salary breakdown, standard deduction (₹75k for New Regime / ₹50k for Old), HRA exemption, and Other Income (FD interest) against TaxSense values.',
        officialRef: 'Salary & House Income'
      },
      {
        id: 'sched_deductions',
        title: 'Schedule: Total Deductions',
        description: 'Verify Chapter VI-A deductions (80C, 80D, 80TTA, 80G) to optimize Old Regime tax liability as determined in your TaxSense session.',
        officialRef: 'Chapter VI-A Deductions'
      },
      {
        id: 'sched_tax_paid',
        title: 'Schedule: Tax Paid',
        description: 'Double check TDS entries from salary (Form 16), other than salary (Form 16A), and any manual self-assessment / advance tax payments.',
        officialRef: 'TDS & TCS Schedules'
      },
      {
        id: 'sched_computation',
        title: 'Schedule: Part B - TI & TTI',
        description: 'Review computed tax liability, interest, and final tax payable or refundable amount. Confirm values are identical to your TaxSense recommendation.',
        officialRef: 'Tax Computation'
      }
    ]
  },
  {
    id: 'verify',
    name: '4. Final Review & e-Verification',
    description: 'Preview the form, submit, and instantly e-verify the return to complete the legal process.',
    items: [
      {
        id: 'submit_return',
        title: 'Preview and Submit Return',
        description: 'Ensure all schedule boxes display a green "Confirmed" label. Preview the ITR form, sign the declaration, and hit Submit.',
        officialRef: 'ITR-1 Form Preview'
      },
      {
        id: 'everify_return',
        title: 'Instant e-Verify via Aadhaar OTP',
        description: 'CRITICAL: e-Verify your ITR within 30 days of submission. Select "Aadhaar OTP", enter the verification code received on your UIDAI registered mobile number.',
        officialRef: 'e-Verify Section',
        officialUrl: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/eVerifyReturn-bl'
      }
    ]
  }
];

const ITR2_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'prep',
    name: '1. Pre-requisites & Documents',
    description: 'In addition to standard forms, collect equity, mutual fund, and physical asset transaction logs.',
    items: [
      {
        id: 'pan_aadhaar_itr2',
        title: 'Link PAN with Aadhaar',
        description: 'Ensure PAN and Aadhaar are linked. Mandatory for processing high-value capital gains transactions in ITR-2.',
        officialRef: 'Sec 139AA of IT Act',
        officialUrl: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/link-aadhaar-status'
      },
      {
        id: 'collect_docs_itr2',
        title: 'Download Form 16, 26AS, AIS/TIS',
        description: 'Download standard Form 16. AIS and Taxpayer Information Summary (TIS) are crucial for verifying capital gains, dividend incomes, and security sales.',
        officialRef: 'AIS/TIS Dashboard',
        officialUrl: 'https://eportal.incometax.gov.in/'
      },
      {
        id: 'cap_gains_stmts',
        title: 'Fetch Capital Gains Statements',
        description: 'Download the comprehensive Capital Gains tax ledger from your stock broker or investment platform (Zerodha, Groww, CAMS, or Karvy) for financial year 2025-26.',
        officialRef: 'Broker Tax Statements'
      },
      {
        id: 'bank_preval_itr2',
        title: 'Validate Active Bank Account',
        description: 'Ensure a valid bank account is linked and pre-validated on the portal for receiving high-value refunds securely.',
        officialRef: 'My Bank Accounts Section',
        officialUrl: 'https://eportal.incometax.gov.in/'
      }
    ]
  },
  {
    id: 'portal',
    name: '2. Portal Entry & Form Selection',
    description: 'Initiate your filing flow and choose the ITR-2 form based on your specific financial indicators.',
    items: [
      {
        id: 'portal_login_itr2',
        title: 'Login to e-Filing Portal',
        description: 'Visit incometax.gov.in and log in using your credentials.',
        officialUrl: 'https://eportal.incometax.gov.in/'
      },
      {
        id: 'start_filing_itr2',
        title: 'Initiate Return Filing Flow',
        description: 'Navigate to "e-File" > "Income Tax Returns" > "File Income Tax Return". Select AY 2026-27, Online mode, and Individual status.',
        officialRef: 'AY 2026-27'
      },
      {
        id: 'select_itr2',
        title: 'Select ITR-2 Form',
        description: 'Select ITR-2. Choose this because you hold Capital Gains (shares, mutual funds, gold, property sales) or your total annual salary income exceeds ₹50 Lakhs.',
        officialRef: 'ITR-2 Selection'
      }
    ]
  },
  {
    id: 'schedules',
    name: '3. Verify Pre-filled & Capital Gains Schedules',
    description: 'Ensure accurate entry of capital gains (Schedule CG) and other high-value assets.',
    items: [
      {
        id: 'sched_personal_itr2',
        title: 'Schedule: Personal Information',
        description: 'Verify your bio-data. Choose residential status (Resident / Non-Resident). If you are a company director or hold unlisted equity shares, declare them here.',
        officialRef: 'Personal Info Schedule'
      },
      {
        id: 'sched_salary_itr2',
        title: 'Schedule: Salary & House Property',
        description: 'Enter Form 16 salary. Unlike ITR-1, Schedule House Property in ITR-2 allows declaring income/interest for multiple properties.',
        officialRef: 'Sch Salary & HP'
      },
      {
        id: 'sched_cg',
        title: 'Schedule: Capital Gains (CG)',
        description: 'Input short-term and long-term gains. STCG on shares/mutual funds (Section 111A) is taxed at 20% (formerly 15%), and LTCG (Section 112A) is taxed at 12.5% (formerly 10%) for AY 2026-27.',
        officialRef: 'Schedule CG'
      },
      {
        id: 'sched_112a',
        title: 'Schedule: 112A (LTCG Scrip-wise)',
        description: 'Provide scrip-wise transaction details (ISIN, sale price, cost of acquisition, Fair Market Value as of Jan 31, 2018) for long-term equity shares/mutual funds sold.',
        officialRef: 'Schedule 112A'
      },
      {
        id: 'sched_os_itr2',
        title: 'Schedule: Income From Other Sources',
        description: 'Declare dividends, bank interest, and family pensions. Split dividend income quarterly to avoid advance tax interest penalty under Section 234C.',
        officialRef: 'Schedule OS'
      },
      {
        id: 'sched_vi_a_itr2',
        title: 'Schedule: VIA (Deductions)',
        description: 'Confirm 80C, 80D, 80G, and other eligible deductions to lower taxable income.',
        officialRef: 'Schedule VIA'
      },
      {
        id: 'sched_tax_paid_itr2',
        title: 'Schedule: Tax Payments',
        description: 'Confirm all tax credits, TDS, TCS, advance tax, and self-assessment tax match with Form 26AS/AIS to prevent credit mismatches.',
        officialRef: 'TDS & Advance Tax'
      }
    ]
  },
  {
    id: 'verify',
    name: '4. Final Review & e-Verification',
    description: 'Carefully compute tax liability, review, and e-verify return within 30 days.',
    items: [
      {
        id: 'submit_return_itr2',
        title: 'Preview, Validate and Submit',
        description: 'Run the platform verification diagnostic. Resolve any validation errors in Schedule CG or 112A. Preview and submit return.',
        officialRef: 'ITR-2 Form Preview'
      },
      {
        id: 'everify_return_itr2',
        title: 'Instant e-Verify with Aadhaar OTP',
        description: 'e-Verify within 30 days of filing. Unverified ITRs are treated as invalid and will not be processed by CPC Bengaluru.',
        officialRef: 'e-Verify Section',
        officialUrl: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/eVerifyReturn-bl'
      }
    ]
  }
];

export default function FilingGuide({ isOpen, onClose }: FilingGuideProps) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Connect to global tax store to recommend ITR type based on user's active portfolio
  const formType = useTaxStore((state) => state.formType);
  const [selectedItr, setSelectedItr] = useState<'itr1' | 'itr2'>('itr1');

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taxsense_filing_guide_progress');
      if (stored) {
        setCompletedItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load filing guide progress:', e);
    }
  }, []);

  // Sync state when global formType recommendation changes
  useEffect(() => {
    if (formType === 'ITR-2') {
      setSelectedItr('itr2');
    } else {
      setSelectedItr('itr1');
    }
  }, [formType]);

  // Sync state to localStorage on modification
  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const updated = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      localStorage.setItem('taxsense_filing_guide_progress', JSON.stringify(updated));
      return updated;
    });
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset your checklist progress?')) {
      setCompletedItems([]);
      localStorage.removeItem('taxsense_filing_guide_progress');
    }
  };

  const activeCategories = selectedItr === 'itr1' ? ITR1_CATEGORIES : ITR2_CATEGORIES;

  // Compute stats based on active category
  const activeItemIds = activeCategories.flatMap(cat => cat.items.map(item => item.id));
  const totalSteps = activeItemIds.length;
  const activeCompletedCount = completedItems.filter(id => activeItemIds.includes(id)).length;
  const percentage = Math.round((activeCompletedCount / totalSteps) * 100) || 0;

  // Filter content by category tab selection
  const displayedCategories = activeTab === 'all' 
    ? activeCategories 
    : activeCategories.filter(cat => cat.id === activeTab);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with elegant blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-white w-full max-w-3xl h-[85vh] max-h-[720px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 z-10 animate-fade-in"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-blue-100">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">ITR Online Filing Checklists</h2>
                    <p className="text-xs text-slate-400">Step-by-step guidance mapped against official Income Tax Department procedures</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Switcher & Recommendation Badge */}
            <div className="px-6 py-3 bg-slate-100/50 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  id="btn-switch-checklist-itr1"
                  onClick={() => { setSelectedItr('itr1'); setActiveTab('all'); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    selectedItr === 'itr1'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  ITR-1 (Sahaj)
                  {formType === 'ITR-1' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">
                      Recommended
                    </span>
                  )}
                </button>
                <button
                  id="btn-switch-checklist-itr2"
                  onClick={() => { setSelectedItr('itr2'); setActiveTab('all'); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    selectedItr === 'itr2'
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  ITR-2 (Capital Gains)
                  {formType === 'ITR-2' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                      Recommended
                    </span>
                  )}
                </button>
              </div>

              {/* Status context */}
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                {selectedItr === 'itr1' ? (
                  <span className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    For resident individuals with gross income ≤ ₹50L
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    For individuals with capital gains, foreign assets, or salary &gt; ₹50L
                  </span>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Your {selectedItr === 'itr1' ? 'ITR-1' : 'ITR-2'} Progress</span>
                  </span>
                  <span className="font-mono text-blue-600">{activeCompletedCount} of {totalSteps} steps completed ({percentage}%)</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeCompletedCount > 0 && (
                  <button 
                    onClick={resetProgress}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-semibold cursor-pointer transition-all active:scale-95"
                  >
                    <RefreshCw className="h-3 w-3 text-slate-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Navigation Tabs */}
            <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-100 flex gap-1 overflow-x-auto scrollbar-none text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'all' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Steps
              </button>
              {activeCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-3 py-1.5 font-semibold rounded-lg whitespace-nowrap transition-all ${
                    activeTab === cat.id 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat.id === 'prep' && '1. Prep'}
                  {cat.id === 'portal' && '2. Portal Entry'}
                  {cat.id === 'schedules' && '3. Schedules'}
                  {cat.id === 'verify' && '4. Submit'}
                </button>
              ))}
            </div>

            {/* Checklist items list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {displayedCategories.map((category) => (
                <div key={category.id} className="space-y-3">
                  <div className="border-b border-slate-100 pb-1.5">
                    <h3 className="text-sm font-bold text-slate-800">{category.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{category.description}</p>
                  </div>

                  <div className="grid gap-3">
                    {category.items.map((item) => {
                      const isCompleted = completedItems.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none group ${
                            isCompleted 
                              ? 'bg-emerald-50/30 border-emerald-150 shadow-2xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="mt-0.5 shrink-0">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-600 text-white scale-100' 
                                : 'border-slate-300 group-hover:border-slate-400 bg-white'
                            }`}>
                              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                            </div>
                          </div>

                          {/* Text Detail */}
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h4 className={`text-xs font-bold leading-normal transition-colors ${
                                isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                              }`}>
                                {item.title}
                              </h4>
                              {item.officialRef && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                  {item.officialRef}
                                </span>
                              )}
                            </div>
                            <p className={`text-[11px] leading-relaxed transition-colors ${
                              isCompleted ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {item.description}
                            </p>
                            
                            {item.officialUrl && (
                              <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
                                <a 
                                  href={item.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                                >
                                  <span>Official Portal Link</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with informational banner */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>Always verify details against official communication received on your registered email & phone number.</span>
              </div>
              <div className="flex items-center gap-1 font-semibold text-slate-600 shrink-0">
                <span>AY 2026-27 Rules</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

