# TaxSense — The ITR Filing Copilot

**TaxSense** is an AI-powered, conversational web app that helps salaried individuals in India understand, estimate, and prepare their Income Tax Return (ITR-1 / ITR-2 Sahaj) filing for AY 2026-27 (FY 2025-26).

---

## Features

- **AI Chat Copilot** — Conversational interface powered by Google Gemini that answers tax queries, guides data entry, and explains deductions in plain language.
- **Form 16 Import** — Upload your Form 16 PDF; the app extracts income and TDS figures automatically using AI-assisted parsing.
- **Old vs New Regime Comparison** — Side-by-side tax calculation under both regimes, with a clear recommended choice and savings amount.
- **Deduction Optimizer** — Interactive cards covering 15+ deductions (80C, 80D, HRA, NPS, home loan, etc.) with inline tooltips explaining limits and eligibility.
- **Capital Gains Support** — STCG (20%) and LTCG (12.5%, ₹1.25L exempt) handling for ITR-2 filers.
- **Filing Guide** — Step-by-step walkthrough for filing on the Income Tax e-filing portal.
- **Export Controls** — Download your tax summary (PDF via jsPDF or Excel via SheetJS).
- **Finance News Ticker** — Live financial news strip.
- **Portfolio Sync** — Link and sync investment portfolio data.
- **Persistent State** — Tax data persists across sessions using Zustand with local storage hydration.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| State Management | Zustand 5 |
| Backend | Express 4 (served via `server.ts` with tsx) |
| AI | Google Gemini (`@google/genai` v2, server-side) |
| PDF Parsing | `pdf-parse` |
| Charts | Recharts 3 |
| Animations | Motion (Framer Motion v12) |
| PDF Export | jsPDF |
| Excel Export | SheetJS (`xlsx`) |
| Icons | Lucide React |
| Whatsapp(coming soon) | ----|

---

## Project Structure

```
.
├── server.ts                    # Express server + Gemini AI endpoints
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component, main tab layout
│   ├── types.ts                 # TaxData, TaxCalculation, ChatMessage interfaces
│   ├── config.ts                # Assessment year & standard deduction constants
│   ├── index.css                # Global styles
│   ├── components/
│   │   ├── LandingPage.tsx      # Hero / onboarding screen
│   │   ├── ChatInterface.tsx    # AI chat UI
│   │   ├── DeductionCard.tsx    # Deduction input cards (80C, 80D, HRA, etc.)
│   │   ├── RegimeComparison.tsx # Old vs New regime breakdown table
│   │   ├── ExtractionConfirm.tsx# Confirm Form 16 extracted data
│   │   ├── ExportControl.tsx    # PDF / Excel export
│   │   ├── FilingGuide.tsx      # Step-by-step ITR filing guide
│   │   ├── Form16Import.tsx     # Form 16 PDF upload & parse trigger
│   │   ├── FinanceNewsTicker.tsx# Scrolling finance news
│   │   ├── PortfolioSync.tsx    # Investment portfolio sync
│   │   └── GuidelinesInfoBar.tsx# Contextual tax guidelines bar
│   ├── store/
│   │   └── useTaxStore.ts       # Zustand store (income profile + deductions)
│   ├── utils/
│   │   └── taxCalculator.ts     # Core tax computation logic (client-side)
│   └── lib/
│       └── taxEngine.js         # Shared tax engine (also used server-side)
├── app/api/
│   ├── chat/route.js            # /api/chat endpoint (Gemini chat)
│   └── extract/route.js         # /api/extract endpoint (Form 16 PDF parsing)
├── lib/
│   └── taxEngine.js             # Server-side tax engine
├── store/
│   └── useTaxStore.ts/.js       # Store (duplicated for SSR compatibility)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```



## Tax Coverage

- **Assessment Year:** 2026-27 (FY 2025-26)
- **Supported Forms:** ITR-1 (Sahaj) and ITR-2 (with capital gains)
- **Deductions covered:** Standard deduction, HRA, LTA, 80C, 80D, 80TTA/TTB, 80G, 80CCD(1B), 80CCD(2), 80DD, 80U, 80DDB, 80E, 80EEA, 80GG, 80CCH, Section 24(b)
- **Tax regimes:** Both Old and New regime slabs, rebate u/s 87A, 4% health & education cess

---

## BUILT BY
- Srikakulam venkat pranav guptha
- Naidu reshmanth sai
