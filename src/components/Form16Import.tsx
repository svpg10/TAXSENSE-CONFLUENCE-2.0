import React from 'react';
import { UploadCloud, FileText, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useTaxStore } from '../store/useTaxStore';
import { calculateTax, formatINR } from '../utils/taxCalculator';
import { TaxData } from '../types';

interface Form16ImportProps {
  onFileUpload: (fileText: string) => void;
}

export default function Form16Import({ onFileUpload }: Form16ImportProps) {
  const [pasteText, setPasteText] = React.useState('');
  const [dragActive, setDragActive] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingStatus, setProcessingStatus] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  
  const incomeProfile = useTaxStore((state) => state.incomeProfile);
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      try {
        setIsProcessing(true);
        setProcessingStatus('Extracting text from PDF...');
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/extract-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Extraction failed');
        }
        
        const result = await response.json();
        if (result.text) {
          onFileUpload(result.text);
        } else {
          throw new Error('No text extracted from PDF.');
        }
      } catch (err: any) {
        console.error('PDF extract error:', err);
        setErrorMessage("Couldn't read this PDF. Make sure it's a valid Form 16 and try pasting the text manually instead.");
      } finally {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    } else {
      try {
        setIsProcessing(true);
        setProcessingStatus('Reading text file...');
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) {
            onFileUpload(text);
          }
          setIsProcessing(false);
          setProcessingStatus('');
        };
        reader.onerror = () => {
          setErrorMessage("Couldn't read this file. Try copying and pasting the text manually instead.");
          setIsProcessing(false);
          setProcessingStatus('');
        };
        reader.readAsText(file);
      } catch (err: any) {
        setErrorMessage("Couldn't read this file. Try copying and pasting the text manually instead.");
        setIsProcessing(false);
        setProcessingStatus('');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    setProcessingStatus('Analyzing pasted text...');
    onFileUpload(pasteText);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingStatus('');
    }, 1500);
  };

  // Mock Form 16 Templates for Quick Testing inside the card
  const handleSelectMockTemplate = (templateName: 'standard' | 'high' | 'minimal') => {
    let mockForm16Text = '';
    if (templateName === 'standard') {
      mockForm16Text = `
        FORM NO. 16 - Part B
        Employer: TechSolutions Private Limited (PAN: AABCT1234K)
        Employee: Rahul Sharma (PAN: APXPS5678Q)
        Assessment Year: 2026-27
        Financial Year: 2025-26
        
        PARTICULARS OF SALARY:
        1. Gross Salary under Section 17(1): Rs. 8,50,000
        2. Total Gross Salary: Rs. 8,50,000
        
        ALLOWANCES EXEMPT UNDER SECTION 10:
        - House Rent Allowance (HRA) under Section 10(13A): Rs. 45,000
        
        DEDUCTIONS UNDER SECTION 16:
        - Standard Deduction under Section 16(ia): Rs. 75,000
        
        PARTICULARS OF DEDUCTIONS UNDER CHAPTER VI-A:
        - Section 80C (Provident Fund / PPF): Rs. 1,20,000
        - Section 80D (Health Insurance Premium): Rs. 15,000
        - Section 80TTA (Savings Bank Interest): Rs. 5,000
        
        TAX COMPUTATION:
        - Tax Deducted at Source (TDS): Rs. 18,500
      `;
    } else if (templateName === 'high') {
      mockForm16Text = `
        FORM NO. 16 - Part B
        Employer: Alpha Global Corp (PAN: AACCA7890M)
        Employee: Priyanka Patel (PAN: BQXPP1122D)
        Assessment Year: 2026-27
        Financial Year: 2025-26
        
        PARTICULARS OF SALARY:
        1. Gross Salary under Section 17(1): Rs. 14,80,000
        2. Total Gross Salary: Rs. 14,80,000
        
        ALLOWANCES EXEMPT UNDER SECTION 10:
        - House Rent Allowance (HRA) under Section 10(13A): Rs. 1,20,000
        
        DEDUCTIONS UNDER SECTION 16:
        - Standard Deduction under Section 16(ia): Rs. 75,000
        
        PARTICULARS OF DEDUCTIONS UNDER CHAPTER VI-A:
        - Section 80C (EPF, PPF, Life Insurance): Rs. 1,50,000
        - Section 80D (Mediclaim): Rs. 25,000
        - Section 24b (Interest on Home Loan): Rs. 1,80,000
        - Section 80TTA (Savings Bank Interest): Rs. 8,000
        
        TAX COMPUTATION:
        - Tax Deducted at Source (TDS): Rs. 85,000
      `;
    } else {
      mockForm16Text = `
        FORM NO. 16 - Part B
        Assessment Year: 2026-27
        Financial Year: 2025-26
        
        PARTICULARS OF SALARY:
        1. Gross Salary under Section 17(1): Rs. 5,20,000
        2. Total Gross Salary: Rs. 5,20,000
        
        ALLOWANCES EXEMPT UNDER SECTION 10:
        - House Rent Allowance (HRA) under Section 10(13A): Rs. 0
        
        DEDUCTIONS UNDER SECTION 16:
        - Standard Deduction: Rs. 75,000
        
        PARTICULARS OF DEDUCTIONS UNDER CHAPTER VI-A:
        - Section 80C: Rs. 20,000
        - Section 80D: Rs. 0
        
        TAX COMPUTATION:
        - Tax Deducted at Source (TDS): Rs. 0
      `;
    }
    setPasteText(mockForm16Text.trim());
    onFileUpload(mockForm16Text);
  };

  return (
    <div id="form16-import-panel" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800 space-y-5">
      {/* Title */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="h-4.5 w-4.5 text-neutral-800" />
          Form 16 Import Hub
        </h3>
        <p className="text-xs text-slate-400 font-medium">Auto-fill your salary variables with Copilot parsing</p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <span className="text-xs font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-all ${
          dragActive 
            ? 'border-slate-800 bg-slate-50' 
            : 'border-slate-200 hover:border-slate-400 bg-slate-50/20'
        }`}
      >
        {isProcessing && processingStatus ? (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs font-semibold text-slate-600">{processingStatus}</p>
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-700">Drag & Drop Form 16 File</p>
            <p className="text-[10px] text-slate-400 mt-1 mb-3">Accepts .pdf, .txt, .json, or parsed PDF dumps</p>
            
            <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs active:scale-95 transition-all select-none">
              Choose File
              <input 
                type="file" 
                className="hidden" 
                accept=".txt,.json,.csv,.xml,.pdf" 
                onChange={handleFileChange} 
                disabled={isProcessing}
              />
            </label>
          </>
        )}
      </div>

      {/* Custom Paste Text Area */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Or Paste Form 16 Text Directly:
        </label>
        <textarea
          id="paste-form16-textarea"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste plain-text content from Form 16 Part B here (salary structure, standard deductions, TDS summaries)..."
          className="w-full h-32 bg-slate-50/30 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-neutral-500 focus:bg-white transition-all resize-none leading-relaxed"
        />
        
        <button
          id="btn-analyze-pasted-form16"
          onClick={handlePasteSubmit}
          disabled={!pasteText.trim() || isProcessing}
          className="w-full h-9 flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-850 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isProcessing && processingStatus ? 'Analyzing Data...' : 'Analyze pasted Form 16'}</span>
        </button>
      </div>

      {/* Mock inject templates for testing */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Quick Load Sample Scenarios:
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            id="btn-import-mock-8.5"
            onClick={() => handleSelectMockTemplate('standard')}
            className="text-[10px] py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="TechSolutions Form 16 (₹8.5L Gross)"
          >
            ₹8.5L profile
          </button>
          <button
            id="btn-import-mock-14.8"
            onClick={() => handleSelectMockTemplate('high')}
            className="text-[10px] py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Alpha Global Corp Form 16 (₹14.8L Gross)"
          >
            ₹14.8L profile
          </button>
          <button
            id="btn-import-mock-5.2"
            onClick={() => handleSelectMockTemplate('minimal')}
            className="text-[10px] py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Basic Form 16 (₹5.2L Gross)"
          >
            ₹5.2L profile
          </button>
        </div>
      </div>
    </div>
  );
}
