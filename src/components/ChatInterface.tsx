import React from 'react';
import { Send, Bot, User, Sparkles, Paperclip, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTaxStore } from '../store/useTaxStore';

interface ChatInterfaceProps {
  onFileUpload: (fileText: string) => void;
}

export default function ChatInterface({ onFileUpload }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = React.useState<string[]>([
    "Am I eligible for ITR-1?",
    "How to save tax beyond 80C?",
    "What is standard deduction?",
    "Can I claim rent without HRA?",
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Central state from Zustand store
  const chatHistory = useTaxStore((state) => state.chatHistory);
  const addChatMessage = useTaxStore((state) => state.addChatMessage);
  const incomeProfile = useTaxStore((state) => state.incomeProfile);
  const confirmedDeductions = useTaxStore((state) => state.confirmedDeductions);
  const updateDeduction = useTaxStore((state) => state.updateDeduction);
  const setIncomeProfile = useTaxStore((state) => state.setIncomeProfile);
  const setIsChatLoading = useTaxStore((state) => state.setIsChatLoading);
  const formType = useTaxStore((state) => state.formType);

  // Auto-scroll to bottom of messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    // 1. Add User Message to the Store
    const userMsg = {
      role: 'user' as const,
      content: text,
    };
    addChatMessage(userMsg);
    setIsGenerating(true);
    setIsChatLoading(true);

    try {
      // 2. Query the Chat API with the entire synchronized profile and history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory: [...chatHistory, userMsg],
          incomeProfile: {
            grossSalary: incomeProfile.grossSalary || 0,
            hraReceived: incomeProfile.hraReceived || 0,
            tdsDeducted: incomeProfile.tdsDeducted || 0,
            otherIncome: incomeProfile.otherIncome || 0,
            stcg: incomeProfile.stcg || 0,
            ltcg: incomeProfile.ltcg || 0,
          },
          confirmedDeductions: confirmedDeductions,
        }),
      });

      const result = await response.json();
      if (result.success && result.reply) {
        // 3. Add Assistant Response to the Store
        addChatMessage({
          role: 'assistant',
          content: result.reply,
        });

        // 4. Update the suggestions dynamically if provided
        if (result.suggestedQuestions && Array.isArray(result.suggestedQuestions)) {
          setSuggestedQuestions(result.suggestedQuestions);
        }

        // 5. If a missing deduction field is successfully clarified, apply it!
        if (result.missingField) {
          const matchValue = text.match(/\d+/g);
          if (matchValue && matchValue.length > 0) {
            const numericValue = parseInt(matchValue[0]);
            if (!isNaN(numericValue)) {
              if (result.missingField === '80C' || result.missingField === 'deduction80C') {
                updateDeduction('80C', numericValue);
              } else if (result.missingField === '80D' || result.missingField === 'deduction80D') {
                updateDeduction('80D', numericValue);
              } else if (result.missingField === 'rentPaid' || result.missingField === 'hraExemption' || result.missingField === 'HRA exemption') {
                updateDeduction('HRA exemption', numericValue);
              }
            }
          }
        }
      } else {
        throw new Error(result.error || 'The tax copilot did not return a valid response.');
      }
    } catch (err: any) {
      console.error(err);
      addChatMessage({
        role: 'assistant',
        content: `⚠️ **Oops! I ran into an error connecting to the server:** ${err.message || 'Please check your connection and try again.'}`,
      });
    } finally {
      setIsGenerating(false);
      setIsChatLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;
    const text = inputValue;
    setInputValue('');
    handleSendMessage(text);
  };

  const handlePromptClick = (text: string) => {
    if (isGenerating) return;
    handleSendMessage(text);
  };

  // Mock Form 16 Templates for Quick Testing in AI Studio Preview!
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
        2. Value of perquisites under Section 17(2): Rs. 0
        3. Profits in lieu of salary under Section 17(3): Rs. 0
        4. Total Gross Salary: Rs. 8,50,000
        
        ALLOWANCES EXEMPT UNDER SECTION 10:
        - House Rent Allowance (HRA) under Section 10(13A): Rs. 45,000
        - Leave Travel Allowance (LTA) under Section 10(5): Rs. 0
        
        DEDUCTIONS UNDER SECTION 16:
        - Standard Deduction under Section 16(ia): Rs. 50,000
        
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
        - Standard Deduction under Section 16(ia): Rs. 50,000
        
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
        - Standard Deduction: Rs. 50,000
        
        PARTICULARS OF DEDUCTIONS UNDER CHAPTER VI-A:
        - Section 80C: Rs. 20,000
        - Section 80D: Rs. 0
        
        TAX COMPUTATION:
        - Tax Deducted at Source (TDS): Rs. 0
      `;
    }
    onFileUpload(mockForm16Text);
  };

  return (
    <div id="chat-interface" className="flex flex-col h-[650px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              TaxSense Copilot
              <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Conversational ITR-1 Tax Assistant</p>
          </div>
        </div>
        
        {/* Sample Documents Injector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400">Sample Form 16:</span>
          <div className="flex gap-1">
            <button
              id="btn-mock-standard"
              onClick={() => handleSelectMockTemplate('standard')}
              className="text-[10px] px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-md transition-colors"
              title="TechSolutions Form 16 (₹8.5L Gross)"
            >
              ₹8.5L
            </button>
            <button
              id="btn-mock-high"
              onClick={() => handleSelectMockTemplate('high')}
              className="text-[10px] px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-md transition-colors"
              title="Alpha Global Corp Form 16 (₹14.8L Gross)"
            >
              ₹14.8L
            </button>
            <button
              id="btn-mock-minimal"
              onClick={() => handleSelectMockTemplate('minimal')}
              className="text-[10px] px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-md transition-colors"
              title="Basic Form 16 (₹5.2L Gross)"
            >
              ₹5.2L
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-2.5 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className="space-y-1">
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="space-y-1.5 font-sans">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className={msg.role === 'user' ? "mb-1 last:mb-0 leading-relaxed text-white" : "mb-2 last:mb-0 leading-relaxed text-slate-750"}>{children}</p>,
                      strong: ({ children }) => <strong className={msg.role === 'user' ? "font-bold text-white underline decoration-blue-300" : "font-bold text-slate-950"}>{children}</strong>,
                      table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden bg-white text-slate-800 shadow-xs">{children}</table></div>,
                      thead: ({ children }) => <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">{children}</thead>,
                      tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
                      tr: ({ children }) => <tr className="hover:bg-slate-50 transition-colors">{children}</tr>,
                      th: ({ children }) => <th className="p-2 border border-slate-200 font-bold">{children}</th>,
                      td: ({ children }) => <td className="p-2 border border-slate-200">{children}</td>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className={msg.role === 'user' ? "text-white" : "text-slate-700"}>{children}</li>,
                      h1: ({ children }) => <h1 className={msg.role === 'user' ? "text-xs font-black text-white mt-3 mb-1.5 border-b border-blue-400 pb-1" : "text-xs font-black text-slate-900 mt-3 mb-1.5 border-b pb-1"}>{children}</h1>,
                      h2: ({ children }) => <h2 className={msg.role === 'user' ? "text-[11px] font-bold text-white mt-2.5 mb-1" : "text-[11px] font-bold text-slate-900 mt-2.5 mb-1"}>{children}</h2>,
                      h3: ({ children }) => <h3 className={msg.role === 'user' ? "text-[10px] font-bold text-blue-100 mt-2 mb-0.5" : "text-[10px] font-bold text-slate-800 mt-2 mb-0.5"}>{children}</h3>,
                      code: ({ children }) => <code className={msg.role === 'user' ? "bg-blue-750 text-blue-100 px-1 py-0.5 rounded text-[10px] font-mono" : "bg-slate-100 text-rose-600 px-1 py-0.5 rounded text-[10px] font-mono"}>{children}</code>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              <span className={`text-[9px] text-slate-400 block px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-start gap-2.5 max-w-[85%] animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
            <div className="space-y-2 w-full max-w-[280px] sm:max-w-[360px]">
              <div className="bg-white border border-slate-150 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-3">
                <div className="h-3 w-3/4 animate-shimmer rounded-md" />
                <div className="h-2.5 w-full animate-shimmer rounded-md" />
                <div className="h-2.5 w-5/6 animate-shimmer rounded-md" />
                <div className="h-2.5 w-2/3 animate-shimmer rounded-md" />
                
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
                  <span className="text-[10px] text-slate-400 font-medium">Copilot is formulating advice...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Panel */}
      {!isGenerating && suggestedQuestions.length > 0 && (
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5 mb-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
            <Sparkles className="h-3 w-3 text-blue-600" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                id={`btn-suggested-${idx}`}
                key={idx}
                onClick={() => handlePromptClick(q)}
                type="button"
                className="text-[10px] px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:bg-slate-50 rounded-lg text-slate-700 transition-all text-left font-medium shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex gap-2">
          {/* File Uploader */}
          <label className="relative flex items-center justify-center h-10 w-10 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl cursor-pointer transition-colors shadow-sm">
            <Paperclip className="h-4.5 w-4.5" />
            <input
              type="file"
              accept=".txt,.json,.csv,.xml,.html"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    if (text) {
                      onFileUpload(text);
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>

          <input
            id="chat-input-text"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about Form 16 details, deductions, old vs new..."
            disabled={isGenerating}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-55 shadow-inner"
          />
          <button
            id="chat-submit-btn"
            type="submit"
            disabled={!inputValue.trim() || isGenerating}
            className="h-10 w-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 text-center font-medium">
          Note: This copilot guides you through both ITR-1 (Sahaj) and ITR-2 filing requirements. It is an AI model trained on Indian Income Tax laws for AY 2026-27.
        </p>
      </form>
    </div>
  );
}
