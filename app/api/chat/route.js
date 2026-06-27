import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Google AI Studio SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function chatHandler(req, res) {
  try {
    const body = req.body;
    const { incomeProfile, confirmedDeductions, chatHistory } = body;

    // Validate request inputs
    if (!chatHistory || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'chatHistory array is required.' });
    }

    // Build the query and context for the AI
    const profileText = JSON.stringify(incomeProfile || {}, null, 2);
    const deductionsText = JSON.stringify(confirmedDeductions || {}, null, 2);

    // Prepare system instruction with current tax profile context
    const systemInstruction = `You are an empathetic, clear, human tax helper—not a rigid government form. 

Task:
Analyze the user's current income profile and confirmed deductions to see what critical information is missing to maximize their tax savings (ITR-1 Sahaj filing for AY 2025-26).
- If the user receives HRA (hraReceived > 0) but we don't know their monthly rent or if they pay rent, ask for the rent paid.
- If we haven't asked about medical insurance (Section 80D), check if they pay health insurance premiums.
- If they have Section 80C deductions below 1.5 Lakhs, check if they have other investments (like PPF, ELSS, EPF, Life Insurance) to cover the rest.
- If they have home loan interest under Section 24b, check for that.

Rule:
- Ask exactly ONE direct, jargon-free question at a time.
- NEVER generate long, exhausting explanations mid-chat.
- Be friendly, encouraging, and human.

Current Tax Profile Context:
Income Profile:
${profileText}

Confirmed Deductions:
${deductionsText}`;

    // Map chatHistory to Gemini contents parameter
    // Gemini roles: 'user' or 'model'
    const contents = chatHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Invoke Gemini model with structured JSON schema
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The empathetic, direct, jargon-free response or question. Ask exactly one clear question.',
            },
            missingField: {
              type: Type.STRING,
              description: "The name of the missing field or category being queried (e.g., 'rentPaid', '80D', '80C', '80CCD(1B)', or null if none/general response).",
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 highly relevant, short, direct suggested responses or follow-up questions the user can select.',
            },
          },
          required: ['reply', 'missingField', 'suggestedQuestions'],
        },
      },
    });

    const responseText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      reply: parsedData.reply,
      missingField: parsedData.missingField,
      suggestedQuestions: parsedData.suggestedQuestions,
    });
  } catch (error) {
    console.error('Error in multi-turn tax chat API route:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during the tax chat session.' });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { chatHandler };
}
