/**
 * Mathematical Utility for Income Tax Liability Calculations (FY 2025-26 / AY 2026-27)
 * Synchronous calculations under both Old Regime and New Regime (Post-Budget 2024 updates).
 */

/**
 * Calculates HRA Exemption for Old Regime
 * @param {number} hraReceived - Actual HRA received
 * @param {number} basicSalary - Basic Salary
 * @param {number} rentPaid - Total rent paid
 * @param {boolean} isMetro - Whether living in a metro city (Delhi, Mumbai, Kolkata, Chennai)
 * @returns {number} Exempt HRA amount
 */
export function calculateHRAExemption(hraReceived, basicSalary, rentPaid, isMetro = false) {
  const actualHRA = Math.max(0, Number(hraReceived) || 0);
  const basic = Math.max(0, Number(basicSalary) || 0);
  const rent = Math.max(0, Number(rentPaid) || 0);
  
  // (a) Actual HRA received
  // (b) 50% of basic salary for metro, 40% for non-metro
  const pctOfBasic = isMetro ? 0.50 * basic : 0.40 * basic;
  // (c) Total rent paid minus 10% of basic salary
  const rentMinusTenPercent = Math.max(0, rent - 0.10 * basic);

  return Math.min(actualHRA, pctOfBasic, rentMinusTenPercent);
}

/**
 * Calculates Income Tax under the Old Regime (FY 2025-26)
 * @param {Object} params
 * @param {number} params.grossSalary - Gross annual salary
 * @param {number} params.basicSalary - Basic annual salary
 * @param {number} params.hraReceived - Annual HRA received
 * @param {number} params.rentPaid - Annual rent paid
 * @param {boolean} params.isMetro - Metro city flag
 * @param {number} params.deduction80C - Section 80C deductions (capped at 1.5L)
 * @param {number} params.deduction80D - Section 80D deductions (capped at 25k/75k etc.)
 * @param {number} params.otherIncome - Savings/FD interest, dividend, etc.
 * @param {number} params.section24b - Home loan interest (capped at 2L)
 * @returns {Object} { taxableIncome, baseTax, rebate87A, cess, totalTax }
 */
export function calculateOldRegime(params) {
  const grossSalary = Math.max(0, Number(params.grossSalary) || 0);
  const basicSalary = Math.max(0, Number(params.basicSalary) || 0);
  const hraReceived = Math.max(0, Number(params.hraReceived) || 0);
  const rentPaid = Math.max(0, Number(params.rentPaid) || 0);
  const isMetro = !!params.isMetro;
  
  // 1. Calculate HRA Exemption
  const hraExemption = calculateHRAExemption(hraReceived, basicSalary, rentPaid, isMetro);
  
  // 2. Gross Total Income (exclusive of capital gains for slabs)
  const otherIncome = Math.max(0, Number(params.otherIncome) || 0);
  const stcg = Math.max(0, Number(params.stcg) || 0);
  const ltcg = Math.max(0, Number(params.ltcg) || 0);
  
  const baseSalaryTotal = Math.max(0, grossSalary - hraExemption) + otherIncome;
  const grossTotalIncome = baseSalaryTotal + stcg + ltcg;

  // 3. Apply Deductions
  const standardDeduction = 50000;
  const capped80C = Math.min(150000, Math.max(0, Number(params.deduction80C) || 0));
  const capped80D = Math.min(75000, Math.max(0, Number(params.deduction80D) || 0));
  const capped24b = Math.min(200000, Math.max(0, Number(params.section24b) || 0));
  
  // Expanded Chapter VI-A
  const capped80CCD1B = Math.min(50000, Math.max(0, Number(params.deduction80CCD1B) || 0));
  const capped80CCD2 = Math.min(Math.round(grossSalary * 0.10), Math.max(0, Number(params.deduction80CCD2) || 0));
  const capped80DD = Math.min(125000, Math.max(0, Number(params.deduction80DD) || 0));
  const capped80U = Math.min(125000, Math.max(0, Number(params.deduction80U) || 0));
  const capped80DDB = Math.min(100000, Math.max(0, Number(params.deduction80DDB) || 0));
  const capped80E = Math.max(0, Number(params.deduction80E) || 0);
  const capped80EEA = Math.min(150000, Math.max(0, Number(params.deduction80EEA) || 0));
  const capped80GG = Math.min(60000, Math.max(0, Number(params.deduction80GG) || 0));
  const capped80TTA = Math.min(10000, Math.max(0, Number(params.deduction80TTA) || 0));
  const capped80TTB = Math.min(50000, Math.max(0, Number(params.deduction80TTB) || 0));
  
  const interestExemption = capped80TTB > 0 ? capped80TTB : capped80TTA;

  const totalDeductions = 
    standardDeduction + 
    capped80C + 
    capped80D + 
    capped24b +
    capped80CCD1B +
    capped80CCD2 +
    capped80DD +
    capped80U +
    capped80DDB +
    capped80E +
    capped80EEA +
    capped80GG +
    interestExemption;

  const slabTaxableIncome = Math.max(0, baseSalaryTotal - totalDeductions);
  const taxableIncome = slabTaxableIncome + stcg + ltcg;

  // 4. Calculate Old Regime Slab Tax
  let baseTax = 0;
  if (slabTaxableIncome > 250000) {
    const slab2 = Math.min(250000, slabTaxableIncome - 250000);
    baseTax += slab2 * 0.05;
  }
  if (slabTaxableIncome > 500000) {
    const slab3 = Math.min(500000, slabTaxableIncome - 500000);
    baseTax += slab3 * 0.20;
  }
  if (slabTaxableIncome > 1000000) {
    const slab4 = slabTaxableIncome - 1000000;
    baseTax += slab4 * 0.30;
  }

  // Capital Gains Taxes (STCG 20%, LTCG 12.5% after 1.25L exemption)
  const stcgTax = Math.round(stcg * 0.20);
  const ltcgTaxable = Math.max(0, ltcg - 125000);
  const ltcgTax = Math.round(ltcgTaxable * 0.125);
  const totalCapitalGainsTax = stcgTax + ltcgTax;

  const totalBaseTax = baseTax + totalCapitalGainsTax;

  // 5. Rebate Section 87A (Old Regime): 100% tax rebate up to ₹12,500 if total taxable income <= ₹5,00,000
  let rebate87A = 0;
  if (taxableIncome <= 500000) {
    rebate87A = Math.min(12500, totalBaseTax);
  }

  const taxAfterRebate = Math.max(0, totalBaseTax - rebate87A);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    taxableIncome: Math.round(taxableIncome),
    baseTax: Math.round(totalBaseTax),
    rebate87A: Math.round(rebate87A),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax)
  };
}

/**
 * Calculates Income Tax under the New Regime (FY 2025-26 post-budget)
 * @param {Object} params
 * @returns {Object} { taxableIncome, baseTax, rebate87A, cess, totalTax }
 */
export function calculateNewRegime(params) {
  const grossSalary = Math.max(0, Number(params.grossSalary) || 0);
  const otherIncome = Math.max(0, Number(params.otherIncome) || 0);
  const stcg = Math.max(0, Number(params.stcg) || 0);
  const ltcg = Math.max(0, Number(params.ltcg) || 0);
  
  // 1. Gross Total Income
  const baseSalaryTotal = grossSalary + otherIncome;
  const grossTotalIncome = baseSalaryTotal + stcg + ltcg;

  // 2. Standard Deduction: 75,000 for New Regime + 80CCD(2) employer NPS (up to 10% gross)
  const standardDeduction = 75000;
  const capped80CCD2 = Math.min(Math.round(grossSalary * 0.10), Math.max(0, Number(params.deduction80CCD2) || 0));
  const totalDeductions = standardDeduction + capped80CCD2;

  const slabTaxableIncome = Math.max(0, baseSalaryTotal - totalDeductions);
  const taxableIncome = slabTaxableIncome + stcg + ltcg;

  // 3. New Regime Slabs (Post-Budget 2024 update):
  let baseTax = 0;
  if (slabTaxableIncome > 300000) {
    const slab2 = Math.min(400000, slabTaxableIncome - 300000); // 3L to 7L (Budget 2024 adjusted)
    baseTax += slab2 * 0.05;
  }
  if (slabTaxableIncome > 700000) {
    const slab3 = Math.min(300000, slabTaxableIncome - 700000); // 7L to 10L
    baseTax += slab3 * 0.10;
  }
  if (slabTaxableIncome > 1000000) {
    const slab4 = Math.min(200000, slabTaxableIncome - 1000000); // 10L to 12L
    baseTax += slab4 * 0.15;
  }
  if (slabTaxableIncome > 1200000) {
    const slab5 = Math.min(300000, slabTaxableIncome - 1200000); // 12L to 15L
    baseTax += slab5 * 0.20;
  }
  if (slabTaxableIncome > 1500000) {
    const slab6 = slabTaxableIncome - 1500000; // Above 15L
    baseTax += slab6 * 0.30;
  }

  // Capital Gains Taxes (STCG 20%, LTCG 12.5% after 1.25L exemption)
  const stcgTax = Math.round(stcg * 0.20);
  const ltcgTaxable = Math.max(0, ltcg - 125000);
  const ltcgTax = Math.round(ltcgTaxable * 0.125);
  const totalCapitalGainsTax = stcgTax + ltcgTax;

  const totalBaseTax = baseTax + totalCapitalGainsTax;

  // 4. Section 87A rebate adjustments up to 7L net income
  let rebate87A = 0;
  if (taxableIncome <= 700000) {
    rebate87A = Math.min(20000, totalBaseTax);
  }

  const taxAfterRebate = Math.max(0, totalBaseTax - rebate87A);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    taxableIncome: Math.round(taxableIncome),
    baseTax: Math.round(totalBaseTax),
    rebate87A: Math.round(rebate87A),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax)
  };
}

/**
 * Compare Tax Liability under both regimes
 * @param {Object} params
 * @returns {Object} { oldRegimeTax, newRegimeTax, optimalRegime: "OLD" | "NEW", taxSaved: number }
 */
export function calculateTaxComparison(params) {
  const oldRegimeResult = calculateOldRegime(params);
  const newRegimeResult = calculateNewRegime(params);

  const oldRegimeTax = oldRegimeResult.totalTax;
  const newRegimeTax = newRegimeResult.totalTax;
  
  const optimalRegime = oldRegimeTax < newRegimeTax ? 'OLD' : 'NEW';
  const taxSaved = Math.abs(oldRegimeTax - newRegimeTax);

  return {
    oldRegimeTax,
    newRegimeTax,
    optimalRegime,
    taxSaved: Math.round(taxSaved)
  };
}
