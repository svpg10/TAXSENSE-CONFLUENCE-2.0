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
  
  // 2. Gross Total Income (Gross Salary - HRA Exemption + Other Income)
  const otherIncome = Math.max(0, Number(params.otherIncome) || 0);
  const grossTotalIncome = Math.max(0, grossSalary - hraExemption) + otherIncome;

  // 3. Apply Deductions
  const standardDeduction = 50000;
  const capped80C = Math.min(150000, Math.max(0, Number(params.deduction80C) || 0));
  const capped80D = Math.min(75000, Math.max(0, Number(params.deduction80D) || 0));
  const capped24b = Math.min(200000, Math.max(0, Number(params.section24b) || 0));
  
  const totalDeductions = standardDeduction + capped80C + capped80D + capped24b;
  const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

  // 4. Calculate Old Regime Slabs (0% up to 2.5L; 5% from 2.5L to 5L; 20% from 5L to 10L; 30% above 10L)
  let baseTax = 0;
  if (taxableIncome > 250000) {
    const slab2 = Math.min(250000, taxableIncome - 250000);
    baseTax += slab2 * 0.05;
  }
  if (taxableIncome > 500000) {
    const slab3 = Math.min(500000, taxableIncome - 500000);
    baseTax += slab3 * 0.20;
  }
  if (taxableIncome > 1000000) {
    const slab4 = taxableIncome - 1000000;
    baseTax += slab4 * 0.30;
  }

  // 5. Rebate Section 87A (Old Regime): 100% tax rebate up to ₹12,500 if taxable income <= ₹5,00,000
  let rebate87A = 0;
  if (taxableIncome <= 500000) {
    rebate87A = Math.min(12500, baseTax);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    taxableIncome: Math.round(taxableIncome),
    baseTax: Math.round(baseTax),
    rebate87A: Math.round(rebate87A),
    cess: Math.round(cess),
    totalTax: Math.round(totalTax)
  };
}

/**
 * Calculates Income Tax under the New Regime (FY 2025-26 post-budget)
 * @param {Object} params
 * @param {number} params.grossSalary - Gross annual salary
 * @param {number} params.otherIncome - Savings/FD interest, dividend, etc.
 * @param {number} params.deduction80CCD1B - NPS Employee Contribution under 80CCD(1B) (ignored under standard New Regime but tracked)
 * @returns {Object} { taxableIncome, baseTax, rebate87A, cess, totalTax }
 */
export function calculateNewRegime(params) {
  const grossSalary = Math.max(0, Number(params.grossSalary) || 0);
  const otherIncome = Math.max(0, Number(params.otherIncome) || 0);
  
  // 1. Gross Total Income
  const grossTotalIncome = grossSalary + otherIncome;

  // 2. Standard Deduction: 75,000 for New Regime
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, grossTotalIncome - standardDeduction);

  // 3. New Regime Slabs (Post-Budget 2024 update):
  // 0% up to 3L; 5% from 3L to 6L; 10% from 6L to 9L; 15% from 9L to 12L; 20% from 12L to 15L; 30% above 15L
  let baseTax = 0;
  if (taxableIncome > 300000) {
    const slab2 = Math.min(300000, taxableIncome - 300000); // 3L to 6L
    baseTax += slab2 * 0.05;
  }
  if (taxableIncome > 600000) {
    const slab3 = Math.min(300000, taxableIncome - 600000); // 6L to 9L
    baseTax += slab3 * 0.10;
  }
  if (taxableIncome > 900000) {
    const slab4 = Math.min(300000, taxableIncome - 900000); // 9L to 12L
    baseTax += slab4 * 0.15;
  }
  if (taxableIncome > 1200000) {
    const slab5 = Math.min(300000, taxableIncome - 1200000); // 12L to 15L
    baseTax += slab5 * 0.20;
  }
  if (taxableIncome > 1500000) {
    const slab6 = taxableIncome - 1500000; // Above 15L
    baseTax += slab6 * 0.30;
  }

  // 4. Section 87A rebate adjustments up to 7L net income
  // Rebate is 100% of tax up to ₹20,000 if taxable income <= ₹7,00,000
  let rebate87A = 0;
  if (taxableIncome <= 700000) {
    rebate87A = Math.min(20000, baseTax);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const cess = taxAfterRebate * 0.04;
  const totalTax = taxAfterRebate + cess;

  return {
    taxableIncome: Math.round(taxableIncome),
    baseTax: Math.round(baseTax),
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
