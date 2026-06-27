import React from 'react';
import { Check, ShieldCheck, Sparkles, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTaxStore } from '../store/useTaxStore';
import { calculateTax, formatINR } from '../utils/taxCalculator';
import { TaxData } from '../types';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs font-sans space-y-2 max-w-[220px]">
        <p className="font-bold border-b border-slate-800 pb-1.5 text-slate-200 uppercase tracking-wider text-[10px]">{data.name}</p>
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 font-semibold">Slab Tax:</span>
            <span className="font-mono font-bold text-slate-100">{formatINR(data['Slab Tax'])}</span>
          </div>
          {data['Capital Gains Tax'] > 0 && (
            <div className="flex justify-between gap-6">
              <span className="text-slate-400 font-semibold">Capital Gains:</span>
              <span className="font-mono font-bold text-amber-400">{formatINR(data['Capital Gains Tax'])}</span>
            </div>
          )}
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 font-semibold">Cess (4%):</span>
            <span className="font-mono font-bold text-slate-100">{formatINR(data['Education Cess (4%)'])}</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-slate-800 pt-1.5 mt-1 font-bold text-emerald-400">
            <span>Total Tax:</span>
            <span className="font-mono">{formatINR(data.total)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function RegimeComparison() {
  const incomeProfile = useTaxStore((state) => state.incomeProfile);
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);

  // Map Zustand store profile directly to the TaxData structure expected by calculateTax helper
  const taxData: TaxData = {
    assessmentYear: '2026-27',
    grossSalary: incomeProfile.grossSalary || 0,
    hraExemption: confirmedDeductions['HRA exemption'] || confirmedDeductions.hraExemption || 0,
    ltaExemption: 0,
    standardDeductionOld: 50000,
    standardDeductionNew: 75000,
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

  // Perform tax calculations
  const calculation = calculateTax(taxData);
  const { oldRegime, newRegime, recommendedRegime, savings } = calculation;

  const maxTax = Math.max(oldRegime.totalTaxPayable, newRegime.totalTaxPayable, 1000);
  const oldPct = (oldRegime.totalTaxPayable / maxTax) * 100;
  const newPct = (newRegime.totalTaxPayable / maxTax) * 100;

  // Total Chapter VI-A deductions (excluding Standard Deduction of 50k)
  const totalDeductionsClaimed = Math.max(0, oldRegime.totalDeductions - 50000);

  // Capital gains tax components for display
  const stcgTax = Math.round((incomeProfile.stcg || 0) * 0.20);
  const ltcgTaxable = Math.max(0, (incomeProfile.ltcg || 0) - 125000);
  const ltcgTax = Math.round(ltcgTaxable * 0.125);
  const totalCGTax = stcgTax + ltcgTax;

  // Mathematically split tax after rebate into components for correct stacked comparison
  const oldSlabTaxAfterRebate = Math.max(0, oldRegime.baseTax - totalCGTax - oldRegime.rebate87A);
  const oldCGTaxAfterRebate = Math.max(0, totalCGTax - Math.max(0, oldRegime.rebate87A - Math.max(0, oldRegime.baseTax - totalCGTax)));
  
  const newSlabTaxAfterRebate = Math.max(0, newRegime.baseTax - totalCGTax - newRegime.rebate87A);
  const newCGTaxAfterRebate = Math.max(0, totalCGTax - Math.max(0, newRegime.rebate87A - Math.max(0, newRegime.baseTax - totalCGTax)));

  const chartData = [
    {
      name: 'Old Regime',
      'Slab Tax': oldSlabTaxAfterRebate,
      'Capital Gains Tax': oldCGTaxAfterRebate,
      'Education Cess (4%)': oldRegime.cess,
      total: oldRegime.totalTaxPayable,
    },
    {
      name: 'New Regime',
      'Slab Tax': newSlabTaxAfterRebate,
      'Capital Gains Tax': newCGTaxAfterRebate,
      'Education Cess (4%)': newRegime.cess,
      total: newRegime.totalTaxPayable,
    }
  ];

  return (
    <div id="regime-comparison-card" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Tax Regime Comparison</h3>
            <p className="text-xs text-slate-400 font-medium">AY 2026-27 Side-by-Side Analysis</p>
          </div>
          {savings > 0 ? (
            <motion.div 
              key={savings}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>Save {formatINR(savings)}</span>
            </motion.div>
          ) : (
            <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full">
              Equal Tax
            </div>
          )}
        </div>

        {/* Dynamic comparison bars with Spring Animations */}
        <div className="space-y-4 mb-6">
          {/* Old Regime bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                Old Tax Regime
                {recommendedRegime === 'OLD' && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 flex items-center gap-0.5 font-bold">
                    <Check className="h-2.5 w-2.5" /> Best Choice
                  </span>
                )}
              </span>
              <motion.span 
                key={oldRegime.totalTaxPayable}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`font-mono font-bold ${recommendedRegime === 'OLD' ? 'text-emerald-600' : 'text-slate-500'}`}
              >
                {formatINR(oldRegime.totalTaxPayable)}
              </motion.span>
            </div>
            <div className="h-3.5 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 p-0.5">
              <motion.div
                className={`h-full rounded-md ${
                  recommendedRegime === 'OLD' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, oldPct)}%` }}
                transition={{ type: 'spring', damping: 20, stiffness: 85 }}
              />
            </div>
          </div>

          {/* New Regime bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                New Tax Regime (Simplified)
                {recommendedRegime === 'NEW' && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100 flex items-center gap-0.5 font-bold">
                    <Check className="h-2.5 w-2.5" /> Best Choice
                  </span>
                )}
              </span>
              <motion.span 
                key={newRegime.totalTaxPayable}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`font-mono font-bold ${recommendedRegime === 'NEW' ? 'text-emerald-600' : 'text-slate-500'}`}
              >
                {formatINR(newRegime.totalTaxPayable)}
              </motion.span>
            </div>
            <div className="h-3.5 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 p-0.5">
              <motion.div
                className={`h-full rounded-md ${
                  recommendedRegime === 'NEW' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, newPct)}%` }}
                transition={{ type: 'spring', damping: 20, stiffness: 85 }}
              />
            </div>
          </div>
        </div>

        {/* Recharts Graphical Side-by-Side Tax Breakdown */}
        <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4.5 mb-6 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
            Liability Component Breakdown (₹)
          </h4>
          <div className="h-56 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#475569', fontWeight: 600, fontSize: '11px' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => val >= 100000 ? `₹${(val/100000).toFixed(1)}L` : val >= 1000 ? `₹${val/1000}k` : `₹${val}`}
                  tick={{ fill: '#64748b', fontFamily: 'monospace', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}
                />
                <Bar dataKey="Slab Tax" stackId="tax" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={42} />
                {totalCGTax > 0 && (
                  <Bar dataKey="Capital Gains Tax" stackId="tax" fill="#f59e0b" barSize={42} />
                )}
                <Bar dataKey="Education Cess (4%)" stackId="tax" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed side-by-side comparison table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5 shadow-sm">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="p-3 font-semibold">Tax Parameter</th>
                <th className="p-3 text-right font-semibold">Old Regime</th>
                <th className="p-3 text-right font-semibold">New Regime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              <tr>
                <td className="p-3 text-slate-500">Gross Total Salary + Interest</td>
                <td className="p-3 text-right font-mono">{formatINR(oldRegime.grossTotalIncome - (incomeProfile.stcg || 0) - (incomeProfile.ltcg || 0))}</td>
                <td className="p-3 text-right font-mono">{formatINR(newRegime.grossTotalIncome - (incomeProfile.stcg || 0) - (incomeProfile.ltcg || 0))}</td>
              </tr>
              
              {/* Optional Capital Gains section */}
              {((incomeProfile.stcg || 0) > 0 || (incomeProfile.ltcg || 0) > 0) && (
                <tr className="bg-amber-50/20 text-slate-800">
                  <td className="p-3 text-slate-600 font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-650" />
                    <span>Capital Gains Total (STCG + LTCG)</span>
                  </td>
                  <td className="p-3 text-right font-mono">{formatINR((incomeProfile.stcg || 0) + (incomeProfile.ltcg || 0))}</td>
                  <td className="p-3 text-right font-mono">{formatINR((incomeProfile.stcg || 0) + (incomeProfile.ltcg || 0))}</td>
                </tr>
              )}

              <tr>
                <td className="p-3 text-slate-500 font-semibold text-rose-500">Standard Deduction</td>
                <td className="p-3 text-right font-mono text-rose-500">-{formatINR(50000)}</td>
                <td className="p-3 text-right font-mono text-rose-500">-{formatINR(75000)}</td>
              </tr>
              
              <tr>
                <td className="p-3 text-slate-500">Claimed Deductions (80C, 80D, HRA etc.)</td>
                <td className="p-3 text-right font-mono text-slate-500">-{formatINR(totalDeductionsClaimed)}</td>
                <td className="p-3 text-right font-mono text-slate-400">
                  {confirmedDeductions['80CCD(2)'] ? `-${formatINR(confirmedDeductions['80CCD(2)'])}` : 'Not Allowed'}
                </td>
              </tr>

              <tr className="bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-800">Net Taxable Income</td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">{formatINR(oldRegime.taxableIncome)}</td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">{formatINR(newRegime.taxableIncome)}</td>
              </tr>

              <tr>
                <td className="p-3 text-slate-500">Base Slab Tax (Normal slabs)</td>
                <td className="p-3 text-right font-mono">{formatINR(oldRegime.baseTax)}</td>
                <td className="p-3 text-right font-mono">{formatINR(newRegime.baseTax)}</td>
              </tr>

              {totalCGTax > 0 && (
                <tr className="bg-amber-50/10">
                  <td className="p-3 text-amber-800 font-semibold text-[11px] pl-5">
                    → Capital Gains Tax (Flat 20% & 12.5%)
                  </td>
                  <td className="p-3 text-right font-mono text-amber-700">+{formatINR(totalCGTax)}</td>
                  <td className="p-3 text-right font-mono text-amber-700">+{formatINR(totalCGTax)}</td>
                </tr>
              )}

              <tr>
                <td className="p-3 text-slate-500">Section 87A Rebate</td>
                <td className="p-3 text-right font-mono text-rose-500">-{formatINR(oldRegime.rebate87A)}</td>
                <td className="p-3 text-right font-mono text-rose-500">-{formatINR(newRegime.rebate87A)}</td>
              </tr>

              <tr>
                <td className="p-3 text-slate-500 font-medium">Health & Education Cess (4%)</td>
                <td className="p-3 text-right font-mono">{formatINR(oldRegime.cess)}</td>
                <td className="p-3 text-right font-mono">{formatINR(newRegime.cess)}</td>
              </tr>

              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td className="p-3 font-bold text-slate-800">Total Tax Payable</td>
                <td className={`p-3 text-right font-mono font-bold text-sm ${recommendedRegime === 'OLD' ? 'text-emerald-600' : 'text-slate-755'}`}>
                  {formatINR(oldRegime.totalTaxPayable)}
                </td>
                <td className={`p-3 text-right font-mono font-bold text-sm ${recommendedRegime === 'NEW' ? 'text-emerald-600' : 'text-slate-755'}`}>
                  {formatINR(newRegime.totalTaxPayable)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        recommendedRegime === 'NEW' 
          ? 'bg-neutral-900 border-neutral-800 text-neutral-100' 
          : 'bg-blue-50 border-blue-100 text-blue-800'
      }`}>
        <ShieldCheck className={`h-5 w-5 shrink-0 mt-0.5 ${recommendedRegime === 'NEW' ? 'text-white' : 'text-blue-600'}`} />
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
            RECOMMENDED ROUTE: {recommendedRegime === 'NEW' ? 'NEW TAX REGIME' : 'OLD TAX REGIME'}
          </h4>
          <p className="text-xs leading-relaxed">
            {savings > 0 ? (
              <span>
                By selecting the <strong>{recommendedRegime === 'NEW' ? 'New' : 'Old'} Regime</strong>, you save exactly <strong>{formatINR(savings)}</strong> in tax. 
                {recommendedRegime === 'NEW' 
                  ? ' The New Regime offers a flat ₹75,000 standard deduction and lower slab rates.' 
                  : ' Your 80C, 80D, rent, and advanced deductions make the Old Regime significantly more cost-effective.'}
              </span>
            ) : (
              <span>
                Both regimes result in the exact same tax liability. The <strong>New Regime</strong> is recommended due to minimal documentation requirements.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
