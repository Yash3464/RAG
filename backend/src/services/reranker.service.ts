export const rerankResults =
async (
  query: string,
  results: any[]
) => {

  const reranked =
    results.map(
      (result: any) => {

        const text =
          (
            result.document?.content ||
            result.document?.chunkText ||
            ""
          ).toLowerCase();

        const queryWords =
          query
            .toLowerCase()
            .split(" ");

        let score =
          result.hybridScore || 0;

        for (
          const word
          of queryWords
        ) {
          if (
            text.includes(word)
          ) {
            score += 1;
          }
        }

        return {
          ...result,
          rerankScore:
            score
        };
      }
    );

  reranked.sort(
    (a, b) =>
      b.rerankScore -
      a.rerankScore
  );

  return reranked;
};