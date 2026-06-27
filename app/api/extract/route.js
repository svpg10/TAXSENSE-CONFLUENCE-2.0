import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Google AI Studio SDK
// Set User-Agent to 'aistudio-build' in httpOptions for telemetry.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function extractHandler(req, res) {
  try {
    // Read the text content from the request body
    const body = req.body;
    const text = body?.text;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'A raw text payload extracted from a Form 16 PDF is required in the "text" field.' });
    }

    // Call the recommended Gemini model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze the following raw disorganized text extracted from an Indian Form 16 document. Identify and extract standard tax fields according to the schema.
      
      Form 16 Text:
      """
      ${text}
      """`,
      config: {
        systemInstruction: "You are an expert Indian Chartered Accountant (CA) with decades of experience in analyzing personal tax documents and tax filing. Your task is to read through raw, noisy, or disorganized text extracted from a Form 16 PDF and find the critical tax variables. Be highly precise. If any parameter is completely missing from the text and cannot be confidently identified, assign it a value of null instead of guessing random values so the user can edit it manually later.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            employerName: { 
              type: Type.STRING, 
              description: 'The name of the employer. If completely missing, set to null.' 
            },
            grossSalary: { 
              type: Type.INTEGER, 
              description: 'Gross Salary amount under Section 17. If completely missing, set to null.' 
            },
            tdsDeducted: { 
              type: Type.INTEGER, 
              description: 'Tax Deducted at Source (TDS). If completely missing, set to null.' 
            },
            pfContribution: { 
              type: Type.INTEGER, 
              description: 'Provident Fund (PF) / Employee Provident Fund (EPF) contribution under Section 80C. If completely missing, set to null.' 
            },
            hraReceived: { 
              type: Type.INTEGER, 
              description: 'House Rent Allowance (HRA) received. If completely missing, set to null.' 
            }
          },
          required: ['employerName', 'grossSalary', 'tdsDeducted', 'pfContribution', 'hraReceived']
        }
      }
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    // Strict server-side verification to ensure missing fields map to null
    const safeData = {
      employerName: parsedData.employerName !== undefined && parsedData.employerName !== "" ? parsedData.employerName : null,
      grossSalary: (parsedData.grossSalary !== undefined && parsedData.grossSalary !== null) ? Number(parsedData.grossSalary) : null,
      tdsDeducted: (parsedData.tdsDeducted !== undefined && parsedData.tdsDeducted !== null) ? Number(parsedData.tdsDeducted) : null,
      pfContribution: (parsedData.pfContribution !== undefined && parsedData.pfContribution !== null) ? Number(parsedData.pfContribution) : null,
      hraReceived: (parsedData.hraReceived !== undefined && parsedData.hraReceived !== null) ? Number(parsedData.hraReceived) : null,
    };

    return res.json(safeData);
  } catch (error) {
    console.error('Error in Form 16 extraction API route:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during Form 16 data extraction.' });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractHandler };
}
