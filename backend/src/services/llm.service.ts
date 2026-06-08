import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const generateCompletion =
async (
  prompt: string,
  temperature: number = 0.2
) => {

  const completion =
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature
    });

  const result =
    completion.choices[0]
      .message.content || "{}";

  console.log("[LLM]", {
    promptLength: prompt.length,
    responseLength: result.length
  });

  return result;
};

/**
 * Backward compatibility
 * Old controllers can continue using generateAnswer()
 */
export const generateAnswer =
async (
  question: string,
  context: string = ""
) => {

  const prompt = `
Answer the question using the provided context.

CONTEXT:
${context}

QUESTION:
${question}

If the answer is not available in the context,
say:
"Information not found in project context."
`;

  return generateCompletion(
    prompt,
    0.2
  );
};