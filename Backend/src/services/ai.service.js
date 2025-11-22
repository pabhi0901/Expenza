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


async function createBillfromEmail(email){
  const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents:  [
  {
    role: "user",
    parts: [{ text: email }],
  },
],
    config: {
      systemInstruction: `
     You are an expert AI for extracting expense-related information from e-commerce emails.

Your job is to read raw email text or HTML and extract only four fields:
amount, category, vendorName, paymentMethod.

If the email is NOT related to any expense, order, purchase, billing, payment, or transaction,
return ONLY this  JSON:
{
  "mess":"Invalid Email"
}
You are an AI that extracts expense information from e-commerce email text or HTML.

Your response behavior:

• If the email IS a valid expense/order/payment → return ONLY this JSON:
{
  "amount": 0,
  "category": "",
  "vendorName": "",
  "paymentMethod": ""
}

• If the email is NOT related to an expense, order, billing, or payment → return ONLY this JSON:
{
  "mess": "Invalid"
}

No other text is allowed.


================ RULES FOR VALID EMAILS ================

Treat the email as a REAL expense ONLY if it clearly includes:

- order placed
- order confirmed
- payment received
- purchase successful
- invoice generated
- bill generated
- subscription/payment charged
- final amount payable / total paid


================ EMAILS TO IGNORE =================

Return { "mess": "Invalid" } for ALL of these:

- delivery updates
- shipped / out for delivery
- dispatched mails
- cancellation mails
- refunded / return initiated / return completed
- refund confirmations
- promotional emails
- offers / discounts / newsletters
- ads and marketing mails
- wishlist reminders
- login alerts, OTP mails, password reset mails
- account update notifications
- tracking updates / shipment status
- informational / non-transactional mails


================ FIELD EXTRACTION RULES ================

1. "amount":
   - Extract the final payable/charged amount.
   - Remove symbols like ₹, INR, Rs.
   - If unclear → 0.

2. "vendorName":
   - Identify only if clear (e.g., Amazon, Flipkart, Myntra, Meesho, Ajio, Zomato, Swiggy, Instamart, Blinkit).
   - If not clear → "other"

3. "category":
   MUST be one of these ENUM values:

[
  "foodAndDrinks",
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
  "eventsParties"
]

If unclear → "other".

4. "paymentMethod":
   MUST be one of:

["Cash", "UPI", "Card", "Other"]

If unclear → "Other".


================ OUTPUT RULES ================

- Return ONLY JSON.
- No explanations.
- No backticks.
- No text before/after JSON.
- For valid emails → return the 4-field JSON.
- For invalid emails → return ONLY:
{ "mess": "Invalid" }

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


export default {createBillfromText,createBillfromEmail}