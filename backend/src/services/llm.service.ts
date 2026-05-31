import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";

console.log(
  "Groq Key Exists:",
  !!process.env.GROQ_API_KEY
);
console.log(
  process.env.GROQ_API_KEY?.slice(0, 15)
);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAnswer(
  question: string,
  context: string
): Promise<string> {
  try {
    const completion =
      await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "system",
            content: `
You are a document assistant.

Answer ONLY from the provided context.

If the answer is not present,
say:
"I could not find this information in the document."
`,
          },

          {
            role: "user",
            content: `
Context:
${context}

Question:
${question}
`,
          },
        ],

        temperature: 0.2,
      });

    return (
      completion.choices[0].message.content ||
      "No answer generated"
    );
  } catch (error: any) {
    console.error(error);

    return `LLM Error: ${error.message}`;
  }
}
