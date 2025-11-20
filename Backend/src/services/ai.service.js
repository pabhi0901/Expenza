import { GoogleGenAI } from "@google/genai";


async function createBillfromText(billText) {

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:  [
  {
    role: "user",
    parts: [{ text: billText }],
  },
],
    config: {
      systemInstruction: `
      The AI is an expert at understanding extracted OCR text from bills and invoices.

Your job is to clean the text, correct spellings, and extract structured data.

Return output in STRICT JSON format only, with NO explanation, NO additional text, NO backticks.

Use this JSON structure:

{
"amount": 0,
"category": "",
"vendorName": "",
"paymentMethod": ""
}

Rules:

If any field is missing or not clearly identifiable, set its value to null.

Category must be one of:
["foodAndDrinks",
  "groceries",
  "transport",
  "shopping",
  "billsAndUtilities",
  "entertainment",
  "healthAndFitness",
  "education",
  "subscriptions",
  "rent",
  "personalCare",
  "other",
  "fuel",
  "giftsAndDonations",
  "emiLoans",
  "insurance",
  "savingsInvestments",
  "householdItems",
  "kidsFamily",
  "eventsParties",].

Detect total amount from the OCR text.

Detect vendor/store name only if it is clearly readable; otherwise set "vendor": null.

Detect payment method (e.g., Cash, UPI, Card, Credit, Debit, Wallet).

If not clearly detectable, default to "Cash".

Do not include items or item lists.

Return only valid JSON, with no extra formatting or commentary.
`,
    },
    generationConfig: {
    responseMimeType: "application/json"
  }
  });

  //formating json
  let text = response.text
  .replace(/```json/gi, "")   // remove ```json
  .replace(/```/g, "")        // remove ```
  .replace(/^json\s*/i, "")   // remove json prefix
  .trim();
   text = JSON.parse(text);
  return text
}

export default createBillfromText