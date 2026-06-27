export interface TaxData {
  assessmentYear: string;
  grossSalary: number;
  hraExemption: number;
  ltaExemption: number;
  standardDeductionOld: number;
  standardDeductionNew: number;
  otherIncome: number; // e.g. Savings Interest, FDs, Pension
  deduction80C: number; // EPF, PPF, ELSS, Insurance (Max 1.5L)
  deduction80D: number; // Health Insurance (Max 25k self, up to 50k parents)
  deduction80TTA: number; // Savings bank interest exemption (Max 10k)
  deduction80G: number; // Charitable Donations
  section24b: number; // Home Loan Interest (Max 2L)
  tdsDeducted: number; // Tax Deducted at Source
  employerName?: string;
  pfContribution?: number;
  basicSalary?: number;

  // New expanded deductions:
  deduction80CCD1B?: number; // Standalone NPS (Max 50k)
  deduction80CCD2?: number;  // Employer NPS (Max 10% of salary)
  deduction80DD?: number;    // Dependent disability (Max 75k / 1.25L)
  deduction80U?: number;     // Self disability (Max 75k / 1.25L)
  deduction80DDB?: number;   // Specified diseases (Max 40k / 1L)
  deduction80E?: number;     // Education loan interest (Unlimited)
  deduction80EEA?: number;   // First-time home buyer interest (Max 1.5L)
  deduction80GG?: number;    // Rent paid (Max 60k)
  deduction80TTB?: number;   // Senior citizen savings interest (Max 50k)
  deduction80CCH?: number;   // Agnipath Scheme (Agniveer corpus fund)
  section24bLetOut?: number; // Section 24(b) for let-out property

  // Capital Gains for ITR-2:
  stcg?: number;             // Short Term Capital Gains (taxed at 20%)
  ltcg?: number;             // Long Term Capital Gains (taxed at 12.5% after 1.25L exempt)
  formType?: 'ITR-1' | 'ITR-2';
}

export interface TaxRegimeBreakdown {
  grossTotalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxSlabs: Array<{ slab: string; rate: string; tax: number }>;
  baseTax: number;
  rebate87A: number;
  taxAfterRebate: number;
  cess: number;
  totalTaxPayable: number;
  refundOrOwed: number; // Positive means owned/to pay, Negative means refund expected
}

export interface TaxCalculation {
  oldRegime: TaxRegimeBreakdown;
  newRegime: TaxRegimeBreakdown;
  recommendedRegime: 'OLD' | 'NEW';
  savings: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedPrompts?: string[];
}
