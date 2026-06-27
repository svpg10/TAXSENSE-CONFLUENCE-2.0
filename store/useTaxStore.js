import { create } from 'zustand';

export const useTaxStore = create((set) => ({
  incomeProfile: {
    grossSalary: 0,
    tdsDeducted: 0,
    basicSalary: 0,
    hraReceived: 0,
    standardDeduction: 75000,
  },
  confirmedDeductions: {
    '80C': 0,
    '80D': 0,
    'HRA exemption': 0,
    '80CCD(1B)': 0,
    hraExemption: 0,
  },
  chatHistory: [
    {
      role: 'assistant',
      content: `Namaste! Welcome to **TaxSense: The ITR Filing Copilot**. 🇮🇳 
      
I am your interactive companion designed to help salaried individuals file their **ITR-1 (Sahaj)** form easily for **Assessment Year 2026-27** (Financial Year 2025-26).

Here is how you can use me:
1. **Interactive Calculators**: Adjust your salary, exemptions, and 80C/80D investments in the left panel to see real-time tax liabilities for both the **Old** and **New** tax regimes.
2. **Form 16 Extraction**: Upload a Form 16 text document using the 📎 paperclip below, or click one of the **Sample Form 16** buttons (e.g. ₹8.5L or ₹14.8L) in the header to let Gemini analyze and extract your salary variables!
3. **Conversational Copilot**: Ask me questions about deductions, rent receipts, standard deductions, or request a step-by-step walkthrough of your tax liability.

I have preloaded a typical salaried profile to start. How can I help you save tax today?`
    }
  ],
  currentStep: 'LANDING',

  setIncomeProfile: (profile) =>
    set((state) => ({
      incomeProfile: { ...state.incomeProfile, ...profile },
    })),

  updateDeduction: (key, value) =>
    set((state) => {
      const updatedDeductions = { ...state.confirmedDeductions, [key]: value };
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
}));
