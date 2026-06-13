import { Request, Response } from "express";
import { ChunkModel } from "../models/Chunk";
import { RequirementMasterModel } from "../models/RequirementMaster";
import { JournalEntryModel } from "../models/JournalEntry";
import { generateEmbedding } from "../services/embedding.service";
import { generateCompletion } from "../services/llm.service";

export const askQuestion = async (
  req: Request,
  res: Response
) => {

  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required"
      });
    }

    // 1. Vector Search (Document Chunks)
    const queryEmbedding = await generateEmbedding(question);
    const chunks = await ChunkModel.find();

    const scoredChunks = chunks.map((chunk: any) => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        text: chunk.chunkText,
        source: chunk.metadata?.source || "Uploaded Document",
        id: chunk.documentId?.toString() || "",
        similarity
      };
    });

    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scoredChunks.slice(0, 5);

    // 2. Keyword/Regex Match for Requirements & Journal
    // Generate a simple regex matching important words in the question
    const words = question.split(/\s+/).filter((w: string) => w.length > 3).map((w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let queryRegex = /.*/;
    if (words.length > 0) {
      queryRegex = new RegExp(words.join("|"), "i");
    }

    const matchedRequirements = await RequirementMasterModel.find({
      $or: [
        { title: queryRegex },
        { refinedRequirement: queryRegex }
      ]
    }).limit(5);

    const matchedJournal = await JournalEntryModel.find({
      content: queryRegex
    }).limit(5);

    // 3. Compile context
    let context = "";
    
    if (topChunks.length > 0) {
      context += "=== DATA SOURCE DOCUMENT CHUNKS ===\n";
      topChunks.forEach((c, idx) => {
        context += `[Source Doc: ${c.source}] (ID: ${c.id}) Content:\n${c.text}\n\n`;
      });
    }

    if (matchedRequirements.length > 0) {
      context += "=== APPROVED REQUIREMENT MASTER ===\n";
      matchedRequirements.forEach(r => {
        context += `[Requirement Code: ${r.requirementCode}] (ID: ${r._id}) Title: ${r.title}\nRefined Spec: ${r.refinedRequirement}\n\n`;
      });
    }

    if (matchedJournal.length > 0) {
      context += "=== DRAFT BACKLOG ITEMS ===\n";
      matchedJournal.forEach(j => {
        context += `[Backlog Item Type: ${j.classification}] (ID: ${j._id}) Content:\n${j.content}\n\n`;
      });
    }

    const prompt = `
You are a Senior RAG Solutions Analyst and Product Consultant.
Answer the user's natural language question using ONLY the provided project context (Document chunks, Approved requirement master records, and Draft backlog items).

PROJECT CONTEXT:
${context}

QUESTION:
${question}

Return your answer strictly in valid JSON matching the following schema.

JSON SCHEMA:
{
  "answer": "Detailed markdown explanation answering the question based on the context. If not found in the context, output: 'Information not found in project context.'",
  "sources": [
    {
      "type": "document|requirement|backlog",
      "name": "Title of the source (e.g. Stripe KYC spec, MOM meeting note)",
      "id": "Database ID/Code of the source",
      "snippet": "Short summary or snippet of relevant content from this source"
    }
  ],
  "relatedComponents": [
    "Affected codebase paths, database tables, or APIs (e.g. StripeConnect API, kyc_controller.ts, Vendor tables)"
  ],
  "suggestedActions": [
    "Suggested action 1 (e.g. Create new Stripe Connect onboarding task)",
    "Suggested action 2"
  ]
}

CRITICAL RULES:
- Return ONLY the raw JSON.
- DO NOT wrap in markdown \`\`\`json blocks.
- If no matching information exists in the context, return:
  {
    "answer": "Information not found in project context.",
    "sources": [],
    "relatedComponents": [],
    "suggestedActions": []
  }
`;

    const responseText = await generateCompletion(prompt, 0.2);
    let cleanText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanText);
      return res.json({
        success: true,
        ...parsed
      });
    } catch (e) {
      // Rescue regex match
      try {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return res.json({
            success: true,
            ...parsed
          });
        }
      } catch (innerErr) {
        console.error("Failed to parse Ask Query RAG response:", innerErr);
      }
      
      return res.json({
        success: true,
        answer: responseText,
        sources: [],
        relatedComponents: [],
        suggestedActions: []
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate answer"
    });
  }
};

function cosineSimilarity(
  a: number[],
  b: number[]
) {

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {

    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return (
    dot /
    (
      Math.sqrt(magA) *
      Math.sqrt(magB)
    )
  );
}