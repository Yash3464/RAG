import {RequirementMasterModel} from "../models/RequirementMaster";
import {generateCompletion} from "./llm.service";
import {KnowledgeNodeModel} from "../models/KnowledgeNode";

export const findRelatedNodes = async (content: string, excludeNodeId?: string) => {
  const query = excludeNodeId ? { nodeId: { $ne: excludeNodeId } } : {};
  const nodes = await KnowledgeNodeModel.find(query);
  
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", "on", "at", 
    "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", 
    "after", "above", "below", "from", "up", "down", "in", "out", "on", "off", "over", "under", 
    "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", 
    "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", 
    "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "don", "should", 
    "now", "want", "myself", "need", "should", "allow"
  ]);

  const cleanWords = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));
  };

  const contentWords = new Set(cleanWords(content));
  if (contentWords.size === 0) return [];

  return nodes.filter((node: any) => {
    const nodeText = `${node.title || ""} ${node.content || ""}`;
    const nodeWords = cleanWords(nodeText);
    
    let overlapCount = 0;
    for (const w of nodeWords) {
      if (contentWords.has(w)) {
        overlapCount++;
        // If they share at least 2 key terms, count them as related
        if (overlapCount >= 2) return true;
      }
    }
    return false;
  });
};

export const detectRelationships =
async (
  sourceRequirementId: string
) => {

  const source =
    await RequirementMasterModel.findById(
      sourceRequirementId
    );

  if (!source) {
    throw new Error(
      "Requirement not found"
    );
  }

  const others =
    await RequirementMasterModel.find({
      _id: {
        $ne: source._id
      },
      status: "approved"
    });

  if (!others.length) {
    return [];
  }

  const prompt = `
You are an Enterprise Architect.

SOURCE REQUIREMENT

${source.refinedRequirement}

EXISTING REQUIREMENTS

${JSON.stringify(
  others.map(r => ({
    id: r._id,
    requirementCode:
      r.requirementCode,
    requirement:
      r.refinedRequirement
  })),
  null,
  2
)}

Determine relationships.

Allowed relationship types:

- depends_on
- extends
- duplicates
- conflicts_with
- related_to

Return ONLY JSON.

[
  {
    "targetRequirementId": "",
    "relationshipType": "",
    "confidence": 0.9
  }
]
`;

  const result =
    await generateCompletion(
      prompt,
      0.1
    );

  return JSON.parse(
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
  );
};