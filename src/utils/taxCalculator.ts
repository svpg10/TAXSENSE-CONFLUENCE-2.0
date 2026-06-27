import { TaxData, TaxCalculation, TaxRegimeBreakdown } from '../types';

export const INITIAL_TAX_DATA: TaxData = {
  assessmentYear: '2026-27', // Financial Year 2025-26
  grossSalary: 850000,
  hraExemption: 50000,
  ltaExemption: 0,
  standardDeductionOld: 50000,
  standardDeductionNew: 75000,
  otherIncome: 12000,
  deduction80C: 150000,
  deduction80D: 25000,
  deduction80TTA: 10000,
  deduction80G: 0,
  section24b: 0,
  tdsDeducted: 15000,
};

export function calculateTax(data: TaxData): TaxCalculation {
  // --- SPECIAL INCOMES & SPECIAL TAX RATES ---
  const stcg = Math.max(0, Number(data.stcg) || 0);
  const ltcg = Math.max(0, Number(data.ltcg) || 0);
  
  // STCG taxed at flat 20%, LTCG taxed at 12.5% with 1.25L exemption (Union Budget 2024 rules)
  const stcgTax = Math.round(stcg * 0.20);
  const ltcgExempt = 125000;
  const ltcgTaxable = Math.max(0, ltcg - ltcgExempt);
  const ltcgTax = Math.round(ltcgTaxable * 0.125);
  const totalCapitalGainsTax = stcgTax + ltcgTax;

  // --- OLD REGIME CALCULATION ---
  // Gross Total Income (exclusive of flat-taxed capital gains for slab calculation)
  const oldBaseSalaryTotal = Math.max(0, data.grossSalary - data.hraExemption - data.ltaExemption) + data.otherIncome;
  const oldGrossTotalIncome = oldBaseSalaryTotal + stcg + ltcg;
  
  // Deductions under old regime
  const capped80C = Math.min(150000, Math.max(0, data.deduction80C));
  const capped80D = Math.min(75000, Math.max(0, data.deduction80D)); // standard/senior combo limit
  const capped80TTA = Math.min(10000, Math.max(0, data.deduction80TTA));
  const capped80TTB = Math.min(50000, Math.max(0, Number(data.deduction80TTB) || 0));
  const cappedSec24b = Math.min(200000, Math.max(0, data.section24b)); // home loan interest max 2L
  const cappedSection24bLetOut = Math.max(0, Number(data.section24bLetOut) || 0); // let-out property interest
  
  // Additional expanded deductions
  const capped80CCD1B = Math.min(50000, Math.max(0, Number(data.deduction80CCD1B) || 0)); // stand-alone NPS
  const basic = data.basicSalary || Math.round(data.grossSalary * 0.4);
  const capped80CCD2 = Math.min(Math.round(basic * 0.14), Math.max(0, Number(data.deduction80CCD2) || 0)); // employer NPS (14% of basic)
  const capped80CCH = Math.max(0, Number(data.deduction80CCH) || 0); // Agniveer corpus fund
  const capped80DD = Math.min(125000, Math.max(0, Number(data.deduction80DD) || 0)); // disability
  const capped80U = Math.min(125000, Math.max(0, Number(data.deduction80U) || 0)); // self disability
  const capped80DDB = Math.min(100000, Math.max(0, Number(data.deduction80DDB) || 0)); // specified diseases
  const capped80E = Math.max(0, Number(data.deduction80E) || 0); // education loan interest (unlimited)
  const capped80EEA = Math.min(150000, Math.max(0, Number(data.deduction80EEA) || 0)); // first-time homebuyer
  const capped80GG = Math.min(60000, Math.max(0, Number(data.deduction80GG) || 0)); // rent paid
  
  // Decide whether TTA or TTB is applicable (TTB for senior citizens usually, but standard allows standard capping)
  const interestExemption = capped80TTB > 0 ? capped80TTB : capped80TTA;

  const oldTotalDeductions = 
    data.standardDeductionOld + 
    capped80C + 
    capped80D + 
    interestExemption + 
    data.deduction80G + 
    cappedSec24b +
    cappedSection24bLetOut +
    capped80CCD1B +
    capped80CCD2 +
    capped80CCH +
    capped80DD +
    capped80U +
    capped80DDB +
    capped80E +
    capped80EEA +
    capped80GG;

  // Slab tax applies to normal income
  const oldSlabTaxableIncome = Math.max(0, oldBaseSalaryTotal - oldTotalDeductions);
  const oldTaxableIncome = oldSlabTaxableIncome + stcg + ltcg;
  
  // Old regime slabs:
  let oldBaseTax = 0;
  const oldSlabs = [
    { slab: 'Up to ₹2.5 Lakhs', rate: '0%', tax: 0 },
    { slab: '₹2.5 Lakhs to ₹5 Lakhs', rate: '5%', tax: 0 },
    { slab: '₹5 Lakhs to ₹10 Lakhs', rate: '20%', tax: 0 },
    { slab: 'Above ₹10 Lakhs', rate: '30%', tax: 0 },
  ];

  if (oldSlabTaxableIncome > 250000) {
    const slab2Taxable = Math.min(250000, oldSlabTaxableIncome - 250000);
    oldSlabs[1].tax = Math.round(slab2Taxable * 0.05);
    oldBaseTax += oldSlabs[1].tax;
  }
  if (oldSlabTaxableIncome > 500000) {
    const slab3Taxable = Math.min(500000, oldSlabTaxableIncome - 500000);
    oldSlabs[2].tax = Math.round(slab3Taxable * 0.20);
    oldBaseTax += oldSlabs[2].tax;
  }
  if (oldSlabTaxableIncome > 1000000) {
    const slab4Taxable = oldSlabTaxableIncome - 1000000;
    oldSlabs[3].tax = Math.round(slab4Taxable * 0.30);
    oldBaseTax += oldSlabs[3].tax;
  }

  // Include flat tax on capital gains in base tax
  const oldTotalBaseTax = oldBaseTax + totalCapitalGainsTax;

  // Rebate under 87A (Old regime): If total taxable income <= 5,00,000, rebate of 100% of tax up to ₹12,500
  let oldRebate = 0;
  if (oldTaxableIncome <= 500000) {
    oldRebate = Math.min(12500, oldTotalBaseTax);
  }
  const oldTaxAfterRebate = Math.max(0, oldTotalBaseTax - oldRebate);
  const oldCess = Math.round(oldTaxAfterRebate * 0.04);
  const oldTotalTaxPayable = oldTaxAfterRebate + oldCess;
  const oldRefundOrOwed = oldTotalTaxPayable - data.tdsDeducted;

  const oldBreakdown: TaxRegimeBreakdown = {
    grossTotalIncome: oldGrossTotalIncome,
    totalDeductions: oldTotalDeductions,
    taxableIncome: oldTaxableIncome,
    taxSlabs: oldSlabs,
    baseTax: oldTotalBaseTax,
    rebate87A: oldRebate,
    taxAfterRebate: oldTaxAfterRebate,
    cess: oldCess,
    totalTaxPayable: oldTotalTaxPayable,
    refundOrOwed: oldRefundOrOwed,
  };


  // --- NEW REGIME CALCULATION ---
  // New regime allows: standard deduction ₹75,000 + 80CCD(2) employer NPS (14%) + 80CCH Agniveer + 24(b) let-out
  const newBaseSalaryTotal = data.grossSalary + data.otherIncome;
  const newGrossTotalIncome = newBaseSalaryTotal + stcg + ltcg;
  
  const newTotalDeductions = data.standardDeductionNew + capped80CCD2 + capped80CCH + cappedSection24bLetOut;
  const newSlabTaxableIncome = Math.max(0, newBaseSalaryTotal - newTotalDeductions);
  const newTaxableIncome = newSlabTaxableIncome + stcg + ltcg;

  // New regime slabs for FY 2025-26 (AY 2026-27) under Union Budget 2025:
  let newBaseTax = 0;
  const newSlabs = [
    { slab: 'Up to ₹4 Lakhs', rate: '0%', tax: 0 },
    { slab: '₹4 Lakhs to ₹8 Lakhs', rate: '5%', tax: 0 },
    { slab: '₹8 Lakhs to ₹12 Lakhs', rate: '10%', tax: 0 },
    { slab: '₹12 Lakhs to ₹16 Lakhs', rate: '15%', tax: 0 },
    { slab: '₹16 Lakhs to ₹20 Lakhs', rate: '20%', tax: 0 },
    { slab: '₹20 Lakhs to ₹24 Lakhs', rate: '25%', tax: 0 },
    { slab: 'Above ₹24 Lakhs', rate: '30%', tax: 0 },
  ];

  if (newSlabTaxableIncome > 400000) {
    const slab2Taxable = Math.min(400000, newSlabTaxableIncome - 400000);
    newSlabs[1].tax = Math.round(slab2Taxable * 0.05);
    newBaseTax += newSlabs[1].tax;
  }
  if (newSlabTaxableIncome > 800000) {
    const slab3Taxable = Math.min(400000, newSlabTaxableIncome - 800000);
    newSlabs[2].tax = Math.round(slab3Taxable * 0.10);
    newBaseTax += newSlabs[2].tax;
  }
  if (newSlabTaxableIncome > 1200000) {
    const slab4Taxable = Math.min(400000, newSlabTaxableIncome - 1200000);
    newSlabs[3].tax = Math.round(slab4Taxable * 0.15);
    newBaseTax += newSlabs[3].tax;
  }
  if (newSlabTaxableIncome > 1600000) {
    const slab5Taxable = Math.min(400000, newSlabTaxableIncome - 1600000);
    newSlabs[4].tax = Math.round(slab5Taxable * 0.20);
    newBaseTax += newSlabs[4].tax;
  }
  if (newSlabTaxableIncome > 2000000) {
    const slab6Taxable = Math.min(400000, newSlabTaxableIncome - 2000000);
    newSlabs[5].tax = Math.round(slab6Taxable * 0.25);
    newBaseTax += newSlabs[5].tax;
  }
  if (newSlabTaxableIncome > 2400000) {
    const slab7Taxable = newSlabTaxableIncome - 2400000;
    newSlabs[6].tax = Math.round(slab7Taxable * 0.30);
    newBaseTax += newSlabs[6].tax;
  }

  // Include flat tax on capital gains in base tax
  const newTotalBaseTax = newBaseTax + totalCapitalGainsTax;

  // Rebate under 87A (New regime): If total taxable income <= 12,00,000, rebate of 100% of tax up to ₹60,000.
  let newRebate = 0;
  if (newTaxableIncome <= 1200000) {
    newRebate = Math.min(60000, newTotalBaseTax);
  }
  
  const newTaxAfterRebate = Math.max(0, newTotalBaseTax - newRebate);
  const newCess = Math.round(newTaxAfterRebate * 0.04);
  const newTotalTaxPayable = newTaxAfterRebate + newCess;
  const newRefundOrOwed = newTotalTaxPayable - data.tdsDeducted;

  const newBreakdown: TaxRegimeBreakdown = {
    grossTotalIncome: newGrossTotalIncome,
    totalDeductions: newTotalDeductions,
    taxableIncome: newTaxableIncome,
    taxSlabs: newSlabs,
    baseTax: newTotalBaseTax,
    rebate87A: newRebate,
    taxAfterRebate: newTaxAfterRebate,
    cess: newCess,
    totalTaxPayable: newTotalTaxPayable,
    refundOrOwed: newRefundOrOwed,
  };

  // Recommendations:
  const recommendedRegime = oldTotalTaxPayable < newTotalTaxPayable ? 'OLD' : 'NEW';
  const savings = Math.abs(oldTotalTaxPayable - newTotalTaxPayable);

  return {
    oldRegime: oldBreakdown,
    newRegime: newBreakdown,
    recommendedRegime,
    savings,
  };
}

export function isDeductionAllowedInNewRegime(sectionKey: string): boolean {
  const allowed = [
    '80CCD(2)',
    '80CCH',
    'standardDeductionNew',
    'section24bLetOut'
  ];
  return allowed.includes(sectionKey);
}

export function getNewRegimeAllowedDeductions(data: TaxData) {
  const basic = data.basicSalary || Math.round(data.grossSalary * 0.4);
  const capped80CCD2 = Math.min(Math.round(basic * 0.14), Math.max(0, Number(data.deduction80CCD2) || 0));
  const capped80CCH = Math.max(0, Number(data.deduction80CCH) || 0);
  return {
    '80CCD(2)': capped80CCD2,
    '80CCH': capped80CCH,
    total: capped80CCD2 + capped80CCH
  };
}

export function formatINR(val: number): string {
  // Human readable Indian formatting e.g. 1,50,000 instead of 150,000
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(val);
}
