export const chunkText =
(
  text: string,
  chunkSize = 1000
): string[] => {

  if (!text) {
    return [];
  }

  const chunks: string[] = [];

  for (
    let i = 0;
    i < text.length;
    i += chunkSize
  ) {

    const chunk =
      text
        .slice(
          i,
          i + chunkSize
        )
        .trim();

    if (
      chunk.length > 0
    ) {
      chunks.push(chunk);
    }
  }

  return chunks;
};