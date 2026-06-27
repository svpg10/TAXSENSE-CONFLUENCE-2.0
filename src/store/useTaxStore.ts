import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

export function useTaxStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

export interface IncomeProfile {
  grossSalary: number;
  tdsDeducted: number;
  basicSalary: number;
  hraReceived: number;
  standardDeduction: number;
  otherIncome: number;
  employerName?: string;
  pfContribution?: number;
  stcg?: number;
  ltcg?: number;
}

export interface ConfirmedDeductions {
  '80C': number;
  '80D': number;
  'HRA exemption': number;
  '80CCD(1B)': number;
  '80CCD(2)'?: number;
  '80DD'?: number;
  '80U'?: number;
  '80DDB'?: number;
  '80E'?: number;
  '80EEA'?: number;
  '80GG'?: number;
  '80TTA'?: number;
  '80TTB'?: number;
  '80G'?: number;
  '80CCH'?: number;
  'section24bLetOut'?: number;
  section24b?: number;
  // CamelCase fallback for convenience
  hraExemption?: number;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export type CurrentStep = 'HOME' | 'LANDING' | 'CONFIRM_EXTRACTION' | 'CHAT_QA' | 'FINAL_EXPORT';

export interface TaxStoreState {
  incomeProfile: IncomeProfile;
  confirmedDeductions: ConfirmedDeductions;
  chatHistory: ChatMessageItem[];
  currentStep: CurrentStep;
  isExtracting: boolean;
  isChatLoading: boolean;
  formType: 'ITR-1' | 'ITR-2';
  multiHouse: boolean;
  foreignAssets: boolean;
  
  setIncomeProfile: (profile: Partial<IncomeProfile>) => void;
  updateDeduction: (key: keyof ConfirmedDeductions, value: number) => void;
  addChatMessage: (message: ChatMessageItem) => void;
  setStep: (step: CurrentStep) => void;
  setIsExtracting: (val: boolean) => void;
  setIsChatLoading: (val: boolean) => void;
  setFormType: (type: 'ITR-1' | 'ITR-2') => void;
  setMultiHouse: (val: boolean) => void;
  setForeignAssets: (val: boolean) => void;
  clearSession: () => void;
}

const defaultIncomeProfile: IncomeProfile = {
  grossSalary: 850000,
  tdsDeducted: 15000,
  basicSalary: 340000,
  hraReceived: 100000,
  standardDeduction: 75000, // standard default under AY 2026-27 rules
  otherIncome: 12000,
  employerName: 'Acme Corp Technologies',
  pfContribution: 40800,
  stcg: 0,
  ltcg: 0,
};

const defaultConfirmedDeductions: ConfirmedDeductions = {
  '80C': 0,
  '80D': 0,
  'HRA exemption': 0,
  '80CCD(1B)': 0,
  '80CCD(2)': 0,
  '80DD': 0,
  '80U': 0,
  '80DDB': 0,
  '80E': 0,
  '80EEA': 0,
  '80GG': 0,
  '80TTA': 0,
  '80TTB': 0,
  '80G': 0,
  '80CCH': 0,
  'section24bLetOut': 0,
  section24b: 0,
  hraExemption: 0,
};

const defaultChatHistory: ChatMessageItem[] = [
  {
    role: 'assistant',
    content: `Namaste! Welcome to **TaxSense: The ITR Filing Copilot**. 🇮🇳 
      
I am your interactive companion designed to help salaried individuals file their taxes easily for **Assessment Year 2026-27** (Financial Year 2025-26). 

We have upgraded our platform to route you through either **ITR-1 (Salaried Income)** or **ITR-2 (Capital Gains & Investments)** workflows depending on your financial portfolio.

Here is how you can use me:
1. **Interactive Calculators**: Adjust your salary, exemptions, and 80C/80D investments in the left panel to see real-time tax liabilities for both the **Old** and **New** tax regimes.
2. **Form 16 Extraction**: Upload a Form 16 text document using the 📎 paperclip below, or click one of the **Sample Form 16** buttons (e.g. ₹8.5L or ₹14.8L) in the header to let Gemini analyze and extract your salary variables!
3. **Portfolio Sync / Statement Upload**: Sync your broker data or upload stock transactions. The moment Capital Gains are detected, we'll automatically upgrade your session to **ITR-2**.
4. **Conversational Copilot**: Ask me questions about deductions, rent receipts, standard deductions, or request a step-by-step walkthrough of your tax liability.

I have preloaded a typical salaried profile to start. How can I help you save tax today?`
  }
];

export const useTaxStore = create<TaxStoreState>()(
  persist(
    (set) => ({
      incomeProfile: defaultIncomeProfile,
      confirmedDeductions: defaultConfirmedDeductions,
      chatHistory: defaultChatHistory,
      currentStep: 'HOME',
      isExtracting: false,
      isChatLoading: false,
      formType: 'ITR-1',
      multiHouse: false,
      foreignAssets: false,

      setIncomeProfile: (profile) =>
        set((state) => {
          const updatedProfile = { ...state.incomeProfile, ...profile };
          const hasCapitalGains = (updatedProfile.stcg && updatedProfile.stcg > 0) || (updatedProfile.ltcg && updatedProfile.ltcg > 0);
          const isHighSalary = updatedProfile.grossSalary > 5000000;
          const needsITR2 = hasCapitalGains || isHighSalary || state.multiHouse || state.foreignAssets;
          return {
            incomeProfile: updatedProfile,
            formType: needsITR2 ? 'ITR-2' : 'ITR-1',
          };
        }),

      updateDeduction: (key, value) =>
        set((state) => {
          const updatedDeductions = { ...state.confirmedDeductions, [key]: value };
          // Keep HRA exemption fallback in sync if applicable
          if (key === 'HRA exemption') {
            updatedDeductions.hraExemption = value;
          } else if (key === 'hraExemption') {
            updatedDeductions['HRA exemption'] = value;
          }
          return { confirmedDeductions: updatedDeductions };
        }),

      addChatMessage: (message) =>
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        })),

      setStep: (step) =>
        set({ currentStep: step }),

      setIsExtracting: (val) =>
        set({ isExtracting: val }),

      setIsChatLoading: (val) =>
        set({ isChatLoading: val }),

      setFormType: (type) =>
        set({ formType: type }),

      setMultiHouse: (val) =>
        set((state) => {
          const hasCapitalGains = (state.incomeProfile.stcg && state.incomeProfile.stcg > 0) || (state.incomeProfile.ltcg && state.incomeProfile.ltcg > 0);
          const isHighSalary = state.incomeProfile.grossSalary > 5000000;
          const needsITR2 = hasCapitalGains || isHighSalary || val || state.foreignAssets;
          return {
            multiHouse: val,
            formType: needsITR2 ? 'ITR-2' : 'ITR-1',
          };
        }),

      setForeignAssets: (val) =>
        set((state) => {
          const hasCapitalGains = (state.incomeProfile.stcg && state.incomeProfile.stcg > 0) || (state.incomeProfile.ltcg && state.incomeProfile.ltcg > 0);
          const isHighSalary = state.incomeProfile.grossSalary > 5000000;
          const needsITR2 = hasCapitalGains || isHighSalary || state.multiHouse || val;
          return {
            foreignAssets: val,
            formType: needsITR2 ? 'ITR-2' : 'ITR-1',
          };
        }),

      clearSession: () => {
        // Clear from localStorage explicitly
        localStorage.removeItem('taxsense_session_cache');
        // Reset state
        set({
          incomeProfile: defaultIncomeProfile,
          confirmedDeductions: defaultConfirmedDeductions,
          chatHistory: defaultChatHistory,
          currentStep: 'HOME',
          isExtracting: false,
          isChatLoading: false,
          formType: 'ITR-1',
          multiHouse: false,
          foreignAssets: false,
        });
      },
    }),
    {
      name: 'taxsense_session_cache',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        return persistedState;
      },
      partialize: (state) => ({
        incomeProfile: state.incomeProfile,
        confirmedDeductions: state.confirmedDeductions,
        currentStep: state.currentStep,
        formType: state.formType,
        multiHouse: state.multiHouse,
        foreignAssets: state.foreignAssets,
      }),
    }
  )
);
