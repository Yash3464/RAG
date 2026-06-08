import {classifyContent} from "./classification.service";
import {classifyPriority} from "./priority-classifier.service";
import {enrichMetadata} from "./metadata-enrichment.service";

export const processKnowledge =
async (
  content: string
) => {

  const classification =
    await classifyContent(
      content
    );

  const metadata =
    await enrichMetadata(
      content,
      classification.type
    );

  const priority =
    await classifyPriority(
      content,
      classification.type
    );

  return {
    classification,
    metadata,
    priority
  };
};