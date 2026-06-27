import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Shared Gemini initialization on the server (lazy).
// Set User-Agent to 'aistudio-build' in httpOptions for telemetry.
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required but missing. Please set it in AI Studio settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

/**
 * Robust wrapper around generateContent that handles transient 503 errors
 * through automatic retries (exponential backoff) and fallback models.
 */
async function generateContentWithRetryAndFallback(params: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 5;
    let delay = 1000; // starting delay in milliseconds

    while (attempts < maxAttempts) {
      try {
        console.log(`Attempting generateContent using model: ${modelName} (attempt ${attempts + 1}/${maxAttempts})`);
        const aiInstance = getAI();
        const response = await aiInstance.models.generateContent({
          model: modelName,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        attempts++;
        
        // Extract error message, status, and code dynamically and robustly from different formats
        const errorObject = error?.error || error;
        const errorStatus = error?.status || error?.statusCode || errorObject?.code || errorObject?.status;
        const errorMessage = error?.message || errorObject?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        
        const isUnavailable = 
          errorStatus === 'UNAVAILABLE' || 
          errorStatus === 503 || 
          errorStatus === '503' ||
          errorMessage.includes('503') ||
          errorMessage.includes('UNAVAILABLE') ||
          errorMessage.includes('high demand') ||
          errorMessage.includes('Resource has been exhausted') ||
          errorMessage.includes('overloaded');

        if (isUnavailable && attempts < maxAttempts) {
          console.warn(`Model ${modelName} unavailable. Retrying in ${delay}ms... (Attempt ${attempts}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          console.warn(`Model ${modelName} failed on attempt ${attempts}/${maxAttempts} with error:`, errorMessage);
          break; // Switch to the next model in the fallback list
        }
      }
    }
  }

  throw lastError || new Error('Failed to generate content after trying multiple fallback models.');
}

// In-memory cache for finance news
let cachedNews: any[] | null = null;
let lastNewsFetchTime = 0;
const CACHE_DURATION_MS = 3600000; // 1 hour

async function financeNewsHandler(req: any, res: any) {
  try {
    const now = Date.now();
    if (cachedNews && (now - lastNewsFetchTime < CACHE_DURATION_MS)) {
      console.log('Serving finance news from in-memory cache...');
      res.json({ success: true, news: cachedNews });
      return;
    }

    console.log('Generating latest finance news using Gemini...');
    const response = await generateContentWithRetryAndFallback({
      contents: `Generate 6 current, accurate Indian income tax and personal finance news items for FY 2025-26 / AY 2026-27. Each must be a single factual sentence under 120 characters. Topics should rotate between: tax saving tips, ITR deadlines, budget updates, deduction limits, capital gains rules, and TDS rules. Return ONLY a JSON array: [{ id: '1', category: 'TAX SAVING', text: '...', topic: '...' }]. Categories must be one of: TAX SAVING, BUDGET, MARKETS, HRA, SENIORS, SYSTEM, DEADLINE.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING, description: 'Must be one of: TAX SAVING, BUDGET, MARKETS, HRA, SENIORS, SYSTEM, DEADLINE' },
              text: { type: Type.STRING, description: 'A single factual sentence under 120 characters' },
              topic: { type: Type.STRING, description: 'Short keyword/topic suitable for searching' }
            },
            required: ['id', 'category', 'text', 'topic']
          }
        }
      }
    });

    const responseText = response.text?.trim() || '[]';
    const newsArray = JSON.parse(responseText);

    if (Array.isArray(newsArray) && newsArray.length > 0) {
      cachedNews = newsArray;
      lastNewsFetchTime = now;
      res.json({ success: true, news: newsArray });
    } else {
      throw new Error('Gemini returned an empty or invalid array.');
    }
  } catch (error) {
    console.error('Error generating finance news, falling back to defaults:', error);
    res.json({
      success: false,
      news: []
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API: Generate Indian Finance and Tax News Ticker items
  app.get('/api/finance-news', financeNewsHandler);

  // API: Extract PDF Text
  app.post('/api/extract-pdf', upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded.' });
        return;
      }
      const pdfData = await pdfParse(req.file.buffer);
      res.json({ text: pdfData.text });
    } catch (error: any) {
      console.error('PDF parsing failed:', error);
      res.status(422).json({ error: 'Could not read PDF. Try copying and pasting the text instead.' });
    }
  });

  // API: Extract Form 16 Information
  app.post('/api/extract', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text content from Form 16 is required.' });
        return;
      }

      // Query Gemini model for structured tax extraction with automatic fallback/retry
      const response = await generateContentWithRetryAndFallback({
        contents: `Please extract standard tax parameters from the following Form 16 text and return it strictly as JSON according to the schema.
        Extract ALL deduction fields visible in Part B of the Form 16. For any field not explicitly present in the document, return null — do not guess or assume values.
        Look for standard terms:
        - "Gross Salary" or "Section 17(1)" or "Salary as per provisions contained in section 17(1)" for gross salary.
        - "HRA" or "House Rent Allowance" or "10(13A)" for HRA exemption.
        - "Standard Deduction" or "Section 16(ia)" for standard deduction (usually 50,000 in old regimes).
        - "80C" or "Provident Fund" or "PPF" or "ELSS" or "Life Insurance" or "Section 80C" for 80C.
        - "80D" or "Health Insurance" or "Section 80D" for 80D.
        - "80CCD(1B)" or "NPS" for standalone NPS.
        - "80E" or "Education Loan" for education loan interest.
        - "80G" or "Donation" or "Charitable" for charitable donations.
        - "80TTA" or "Savings Bank Interest" for 80TTA.
        - "Section 24" or "24(b)" or "Interest on Borrowed Capital" or "Home Loan Interest" for section 24b.
        - "Basic" or "Basic Salary" or "Basic Pay" for basicSalary.
        - "Other Income" or "Income from Other Sources" or "Section 56" for otherIncome.
        - "TDS" or "Tax Deducted at Source" or "Total tax deducted" or "Section 192" for TDS.

        Here is the Form 16 text:
        ${text}
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assessmentYear: { type: Type.STRING, description: 'The assessment year e.g. "2025-26"' },
              grossSalary: { type: Type.INTEGER, description: 'Gross Salary amount in INR' },
              hraExemption: { type: Type.INTEGER, description: 'HRA exemption amount computed and shown in Form 16 Part B.', nullable: true },
              ltaExemption: { type: Type.INTEGER, description: 'LTA exemption in INR', nullable: true },
              otherIncome: { type: Type.INTEGER, description: 'Any other income declared.', nullable: true },
              deduction80C: { type: Type.INTEGER, description: 'Total 80C deductions (EPF+PPF+ELSS+LIC+home loan principal). Cap ₹1,50,000.', nullable: true },
              deduction80D: { type: Type.INTEGER, description: 'Health insurance premium paid. Cap ₹25,000 self / ₹50,000 parents.', nullable: true },
              deduction80CCD1B: { type: Type.INTEGER, description: 'Standalone NPS contribution under 80CCD(1B). Cap ₹50,000.', nullable: true },
              deduction80E: { type: Type.INTEGER, description: 'Education loan interest paid under Section 80E.', nullable: true },
              deduction80G: { type: Type.INTEGER, description: 'Charitable donations under Section 80G.', nullable: true },
              deduction80TTA: { type: Type.INTEGER, description: 'Savings bank interest under 80TTA. Cap ₹10,000.', nullable: true },
              section24b: { type: Type.INTEGER, description: 'Home loan interest under Section 24(b). Cap ₹2,00,000.', nullable: true },
              basicSalary: { type: Type.INTEGER, description: 'Basic salary component.', nullable: true },
              tdsDeducted: { type: Type.INTEGER, description: 'Tax Deducted at Source (TDS) in INR', nullable: true },
              employerName: { type: Type.STRING, description: 'Name of the employer company', nullable: true },
              pfContribution: { type: Type.INTEGER, description: 'Provident Fund (PF) contribution amount', nullable: true }
            },
            required: ['grossSalary'],
          },
        },
      });

      const jsonStr = response.text?.trim() || '{}';
      const parsedData = JSON.parse(jsonStr);

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error during extraction:', error);
      res.status(500).json({ error: error.message || 'Failed to extract Form 16 data.' });
    }
  });

  // API: Conversational Agent Turns
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, taxData } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Conversation messages array is required.' });
        return;
      }

      // We append a custom instructions system prompt that incorporates user's actual figures!
      const stcg = Number(taxData?.stcg) || 0;
      const ltcg = Number(taxData?.ltcg) || 0;
      const calculatedFormType = (stcg > 0 || ltcg > 0) ? 'ITR-2' : (taxData?.formType || 'ITR-1');

      const systemInstruction = `You are TaxSense Copilot, an elite AI financial advisor specialized in Indian Income Tax filing for individuals for AY 2026-27.
      Your core mission is to help taxpayers understand old vs new tax regimes, optimize their deductions under Chapter VI-A, and route them correctly through ITR workflows:
      - **ITR-1 (Sahaj)**: For individuals with salary income, one house property, other sources (interest etc.), and total income up to ₹50 Lakhs.
      - **ITR-2**: Automatically upgraded when Capital Gains (short-term/long-term gains from stocks, mutual funds, crypto, or other investments) or multiple house properties are present.

      User's Active Filing Status:
      - Current Routed Form: **${calculatedFormType}** ${calculatedFormType === 'ITR-2' ? '(Upgraded due to Capital Gains / Investments)' : '(Salaried / Simple Income)'}

      Keep answers clear, concise, objective, encouraging, and highly structured. 
      
      FORMATTING GUIDELINE (CRITICAL):
      - Whenever presenting comparison of figures, tax regime breakdowns, lists of values, or numeric summaries (e.g., Gross Salary, Standard Deduction, Taxable Income, or Net Tax Liability under New vs Old regime), you MUST present it as a clean Markdown table with tabular columns (e.g. | Component | New Tax Regime (Default) | Old Tax Regime |).
      - Do not output tabular info as raw lists or bullet text if a table can be used.
      - Use standard Markdown bullets (* or -) for other lists.
      - Never leave raw, untidy lines. Align table columns cleanly.
      
      NEVER invent or state regulations that don't exist. Reference exact sections of the Income Tax Act when applicable (e.g., standard deduction of Section 16(ia) of ₹50,000 for old / ₹75,000 for new regime, 80C limit of ₹1.5L, 80CCD(1B) up to ₹50k, 80CCD(2), 80D up to ₹25k/₹50k, 80DD, 80U, 80DDB, 80E, 80EEA, 80G, 80GG, 80TTA up to ₹10k, 80TTB up to ₹50k, 87A rebate).
      
      Here are the user's active, real-time tax figures for AY 2026-27:
      - Assessment Year: AY 2026-27 (Financial Year 2025-26)
      - Form Type: ${calculatedFormType}
      - Gross Salary: ₹${taxData?.grossSalary?.toLocaleString('en-IN') || '0'}
      - HRA Exemption: ₹${taxData?.hraExemption?.toLocaleString('en-IN') || '0'}
      - Standard Deduction (Old): ₹50,000 (fixed)
      - Standard Deduction (New): ₹75,000 (fixed for FY 2025-26 / Budget 2025 update)
      - Other Income (FD/Interest): ₹${taxData?.otherIncome?.toLocaleString('en-IN') || '0'}
      
      Claimed Chapter VI-A Deductions:
      - Section 80C/80CCC/80CCD(1) (EPF, PPF, ELSS, Life Insurance, principal home loan): ₹${taxData?.deduction80C?.toLocaleString('en-IN') || '0'} (Combined limit: ₹1.5 Lakhs)
      - Section 80CCD(1B) (Standalone Employee NPS): ₹${taxData?.deduction80CCD1B?.toLocaleString('en-IN') || '0'} (Max ₹50,000)
      - Section 80CCD(2) (Employer NPS Contribution): ₹${taxData?.deduction80CCD2?.toLocaleString('en-IN') || '0'} (Deductible under both Old & New regime up to 10% of salary)
      - Section 80D (Health Insurance Premium): ₹${taxData?.deduction80D?.toLocaleString('en-IN') || '0'} (Max ₹25,000 self / ₹50,000 senior citizen)
      - Section 80DD/80U (Disability support/Self disability): ₹${((taxData?.deduction80DD || 0) + (taxData?.deduction80U || 0))?.toLocaleString('en-IN') || '0'} (Max ₹75,000 standard / ₹1,25,000 severe)
      - Section 80DDB (Specified diseases like cancer): ₹${taxData?.deduction80DDB?.toLocaleString('en-IN') || '0'} (Max ₹40,000 standard / ₹1,00,000 senior)
      - Section 80E (Education Loan Interest): ₹${taxData?.deduction80E?.toLocaleString('en-IN') || '0'} (Fully deductible, no upper limit, up to 8 years)
      - Section 80EE/80EEA (Additional first-time home buyer interest): ₹${taxData?.deduction80EEA?.toLocaleString('en-IN') || '0'} (Max ₹1.5 Lakhs)
      - Section 80G (Charitable Donations): ₹${taxData?.deduction80G?.toLocaleString('en-IN') || '0'} (50% or 100% eligibility rules)
      - Section 80GG (Rent paid without HRA): ₹${taxData?.deduction80GG?.toLocaleString('en-IN') || '0'} (Capped at ₹5,000/month = ₹60,000/year)
      - Section 80TTA/80TTB (Savings interest exemption): ₹${(taxData?.deduction80TTB || taxData?.deduction80TTA || 0)?.toLocaleString('en-IN') || '0'} (TTA standard ₹10k max / TTB senior ₹50k max)
      - Section 24b Home Loan Interest: ₹${taxData?.section24b?.toLocaleString('en-IN') || '0'} (Max ₹2 Lakhs)
      - Tax Deducted at Source (TDS): ₹${taxData?.tdsDeducted?.toLocaleString('en-IN') || '0'}

      Portfolio & Capital Gains (ITR-2):
      - Short-Term Capital Gains (STCG, Section 111A): ₹${stcg.toLocaleString('en-IN')} (Taxed at flat 20% on listed equity under Union Budget 2024)
      - Long-Term Capital Gains (LTCG, Section 112A): ₹${ltcg.toLocaleString('en-IN')} (Taxed at flat 12.5% after ₹1.25 Lakhs annual exemption ceiling)

      Be hyper-personalized!
      - If user is on ITR-2, congratulate them on portfolio sync, explain that simple ITR-1 (Sahaj) does not permit capital gains reporting, and advise them on how the 20% STCG and 12.5% LTCG (after ₹1.25L exemption) are taxed separately from slab rates.
      - Check if they have maxed out 80C (₹1,50,000). If not, suggest options like PPF, EPF, ELSS, or LIC.
      - Recommend New vs Old based on their numbers. Present New Regime with ₹75,000 standard deduction + 80CCD(2), and contrast it with Old regime which allows standard 80C, 80D, HRA etc.
      - Keep responses friendly but professional. Maintain a high-trust, financial-grade tone. Do not use sales hype.`;

      // Map messages array to Gemini contents parameter
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      // Generate conversational turn with automatic fallback/retry
      const response = await generateContentWithRetryAndFallback({
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        success: true,
        reply: response.text || `I am here to help you file your ${calculatedFormType}. Please ask me any questions about your tax slabs, deductions, or capital gains!`,
      });
    } catch (error: any) {
      console.error('Error during chat:', error);
      res.status(500).json({ error: error.message || 'Failed to process chat conversation.' });
    }
  });

  // Vite static middleware serving or production fallback
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaxSense server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
