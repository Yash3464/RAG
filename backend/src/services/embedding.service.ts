import { pipeline } from "@xenova/transformers";

let extractor: any = null;

export const generateEmbedding = async (
  text: string
): Promise<number[]> => {
  try {
    if (!extractor) {
      console.log(
        "Loading Embedding Model..."
      );

      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );

      console.log(
        "Embedding Model Loaded"
      );
    }

    const output = await extractor(
      text,
      {
        pooling: "mean",
        normalize: true,
      }
    );

    const embedding = Array.from(
      output.data
    ) as number[];

    console.log(
      "Embedding Size:",
      embedding.length
    );

    return embedding;
  } catch (error) {
    console.error(
      "Embedding Error:",
      error
    );

    return [];
  }
};