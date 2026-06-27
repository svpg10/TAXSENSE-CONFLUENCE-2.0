import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useTaxStore } from '../store/useTaxStore';
import { ShieldCheck, Upload, RefreshCw, AlertTriangle, CheckCircle, Info, Database } from 'lucide-react';
import { formatINR } from '../utils/taxCalculator';

const ParamInfoDark: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative inline-flex items-center ml-1 z-30 group">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-neutral-500 hover:text-neutral-300 focus:outline-none cursor-pointer p-0.5 inline-flex items-center align-middle"
        title={text}
      >
        <Info className="h-3 w-3 inline" />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-800 border border-neutral-700 text-neutral-200 text-[10px] font-medium rounded shadow-xl leading-normal text-left z-50 pointer-events-none transition-all">
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
          {text}
        </div>
      )}
    </div>
  );
};

export const PortfolioSync: React.FC = () => {
  const { incomeProfile, setIncomeProfile, formType } = useTaxStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSource, setSyncSource] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stcgValue = incomeProfile.stcg || 0;
  const ltcgValue = incomeProfile.ltcg || 0;

  // 1. Demo Mode Toggle
  const handleDemoToggle = (checked: boolean) => {
    setIsDemoActive(checked);
    if (checked) {
      setIncomeProfile({
        stcg: 45000,
        ltcg: 165000,
      });
      setSyncSource('Demo Mode');
    } else {
      setIncomeProfile({
        stcg: 0,
        ltcg: 0,
      });
      setSyncSource(null);
    }
  };

  // 2. CSV and Excel Spreadsheet Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parsePortfolioFile(file);
  };

  const parsePortfolioFile = (file: File) => {
    setCsvError(null);
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            throw new Error("No data rows found in Excel sheet. Ensure the first row contains column headers like 'STCG' and 'LTCG'.");
          }

          const headers = jsonData[0].map((h: any) => String(h || '').trim().toLowerCase());
          let stcgIndex = -1;
          let ltcgIndex = -1;

          headers.forEach((h: string, idx: number) => {
            if (h.includes('stcg') || h.includes('short')) stcgIndex = idx;
            if (h.includes('ltcg') || h.includes('long')) ltcgIndex = idx;
          });

          if (stcgIndex === -1 || ltcgIndex === -1) {
            throw new Error("Could not find 'STCG' and 'LTCG' columns in Excel sheet. Please make sure headers are present.");
          }

          let parsedSTCG = 0;
          let parsedLTCG = 0;

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            const stcgVal = parseFloat(row[stcgIndex]) || 0;
            const ltcgVal = parseFloat(row[ltcgIndex]) || 0;
            parsedSTCG += stcgVal;
            parsedLTCG += ltcgVal;
          }

          setIncomeProfile({
            stcg: Math.round(parsedSTCG),
            ltcg: Math.round(parsedLTCG),
          });
          setSyncSource('Excel Upload');
        } catch (err: any) {
          setCsvError(err.message || "Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Treat as CSV
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            throw new Error("File is empty.");
          }

          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) {
            throw new Error("No data rows found. Ensure header contains 'STCG' and 'LTCG'.");
          }

          let parsedSTCG = 0;
          let parsedLTCG = 0;
          let stcgIndex = -1;
          let ltcgIndex = -1;

          // Parse headers
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          stcgIndex = headers.indexOf('stcg');
          ltcgIndex = headers.indexOf('ltcg');

          if (stcgIndex === -1 || ltcgIndex === -1) {
            // Try loose matching
            headers.forEach((h, idx) => {
              if (h.includes('stcg') || h.includes('short')) stcgIndex = idx;
              if (h.includes('ltcg') || h.includes('long')) ltcgIndex = idx;
            });
          }

          if (stcgIndex === -1 || ltcgIndex === -1) {
            throw new Error("Could not find 'STCG' and 'LTCG' columns in CSV header.");
          }

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            const stcgVal = parseFloat(cols[stcgIndex]) || 0;
            const ltcgVal = parseFloat(cols[ltcgIndex]) || 0;
            parsedSTCG += stcgVal;
            parsedLTCG += ltcgVal;
          }

          setIncomeProfile({
            stcg: Math.round(parsedSTCG),
            ltcg: Math.round(parsedLTCG),
          });
          setSyncSource('CSV Upload');
        } catch (err: any) {
          setCsvError(err.message || "Failed to parse CSV file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parsePortfolioFile(file);
    }
  };

  // 3. Manual entry adjustments
  const handleManualChange = (field: 'stcg' | 'ltcg', value: string) => {
    const numericVal = Math.max(0, parseInt(value.replace(/,/g, '')) || 0);
    setIncomeProfile({ [field]: numericVal });
    setSyncSource('Manual Adjustment');
  };

  const clearCapitalGains = () => {
    setIncomeProfile({ stcg: 0, ltcg: 0 });
    setSyncSource(null);
    setIsDemoActive(false);
  };

  return (
    <div id="portfolio-sync-widget" className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 font-sans relative overflow-hidden">
      {/* Background Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-mono font-bold tracking-wider text-neutral-200 uppercase">
            Broker Portfolio Sync
          </h3>
        </div>
        <div className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Secure 256-Bit
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        {/* Description */}
        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
          Capital gains from stock, mutual fund, or crypto trades cannot be filed under ITR-1. 
          Use this panel to sync your broker account or upload a transactions list to automatically switch to the comprehensive <span className="font-mono text-neutral-200">ITR-2</span> workflow.
        </p>

        {/* Import capital gains statement */}
        <div className="bg-neutral-950 border border-neutral-800 rounded p-3 space-y-1">
          <h4 className="text-xs font-bold text-neutral-200">
            Import capital gains statement
          </h4>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Download your Capital Gains P&L report from your broker and upload it below. Zerodha: Console → P&L → Download. Groww: Reports → Capital Gains.
          </p>
        </div>

        {/* Drag & Drop Upload Container */}
        <div 
          id="excel-csv-drag-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-neutral-800 hover:border-neutral-600 bg-neutral-950 rounded p-4 text-center cursor-pointer transition-colors group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv,.xlsx,.xls" 
            className="hidden" 
          />
          <Upload className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 mx-auto mb-2 transition-transform group-hover:-translate-y-0.5" />
          <p className="text-[11px] font-medium text-neutral-300">Drag & drop stock ledger (.csv, .xlsx, .xls)</p>
          <p className="text-[9px] text-neutral-500 mt-0.5 font-mono">Header columns required: "STCG" and "LTCG"</p>
        </div>

        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="demo-mode-toggle"
            checked={isDemoActive}
            onChange={(e) => handleDemoToggle(e.target.checked)}
            className="w-3.5 h-3.5 accent-amber-500 rounded border-neutral-800 bg-neutral-950 cursor-pointer"
          />
          <label htmlFor="demo-mode-toggle" className="text-xs text-neutral-400 select-none cursor-pointer hover:text-neutral-300">
            Load sample data for demo
          </label>
        </div>

        {/* Yellow Banner for Demo Mode */}
        {isDemoActive && (
          <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[11px] text-amber-200 font-sans font-medium">
              Demo data loaded — replace with your actual figures before filing
            </span>
          </div>
        )}

        {csvError && (
          <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/60 p-2.5 rounded text-[11px] text-red-300 font-sans">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <span>{csvError}</span>
          </div>
        )}

        {/* Interactive Manual Adjustment / Verification Fields */}
        <div className="bg-neutral-950 border border-neutral-800 rounded p-3.5 space-y-3">
          <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Portfolio Gains Registry</span>
            {(stcgValue > 0 || ltcgValue > 0) && (
              <button 
                onClick={clearCapitalGains}
                className="text-[10px] text-red-400 hover:text-red-300 font-mono lowercase normal-case tracking-normal hover:underline cursor-pointer"
              >
                [reset portfolio]
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1 flex items-center">
                <span>STCG (Sec. 111A)</span>
                <ParamInfoDark text="Short Term Capital Gains on shares or equity funds held for 12 months or less. Taxed at a flat 20% rate." />
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-neutral-500 text-xs">₹</span>
                <input
                  type="text"
                  id="portfolio-stcg-input"
                  value={stcgValue ? stcgValue.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleManualChange('stcg', e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded text-xs text-neutral-200 py-1 pl-5 pr-2 focus:outline-none"
                />
              </div>
              <span className="text-[9px] text-neutral-500 block mt-1">Tax rate: 20%</span>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-500 mb-1 flex items-center">
                <span>LTCG (Sec. 112A)</span>
                <ParamInfoDark text="Long Term Capital Gains on shares or equity funds held for more than 12 months. First ₹1.25 Lakhs per year is tax-free; excess is taxed at 12.5%." />
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1.5 text-neutral-500 text-xs">₹</span>
                <input
                  type="text"
                  id="portfolio-ltcg-input"
                  value={ltcgValue ? ltcgValue.toLocaleString('en-IN') : ''}
                  onChange={(e) => handleManualChange('ltcg', e.target.value)}
                  placeholder="0"
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-600 rounded text-xs text-neutral-200 py-1 pl-5 pr-2 focus:outline-none"
                />
              </div>
              <span className="text-[9px] text-neutral-500 block mt-1">Exempt limit: 1.25L</span>
            </div>
          </div>
        </div>

        {/* Dynamic Routing / Sync State Banners */}
        {isSyncing && (
          <div className="bg-neutral-950 border border-neutral-800 p-3 rounded flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-neutral-400 animate-spin shrink-0" />
            <div className="text-[11px]">
              <p className="font-semibold text-neutral-200">Syncing with {syncSource}...</p>
              <p className="text-neutral-500 mt-0.5">Fetching tax statements securely</p>
            </div>
          </div>
        )}

        {!isSyncing && (stcgValue > 0 || ltcgValue > 0) && (
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded space-y-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 text-[35px] font-black text-emerald-500/5 select-none pointer-events-none font-mono tracking-tighter">
              ITR-2
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-sans">
                <p className="font-bold text-emerald-300">
                  🎉 Switched to ITR-2 Filing Workflow
                </p>
                <p className="text-emerald-400/90 mt-0.5 leading-relaxed">
                  Detected capital gains of <span className="font-mono text-neutral-200 font-bold">{formatINR(stcgValue)}</span> STCG and <span className="font-mono text-neutral-200 font-bold">{formatINR(ltcgValue)}</span> LTCG. Form routing upgraded successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isSyncing && stcgValue === 0 && ltcgValue === 0 && (
          <div className="bg-neutral-950 border border-neutral-800 p-2.5 rounded flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="text-[10px] text-neutral-500 font-sans">
              Currently routed through standard <strong className="font-mono text-neutral-400">ITR-1 (Sahaj)</strong>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
