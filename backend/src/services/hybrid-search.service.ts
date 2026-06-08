import {
  bm25Search
} from "./bm25-search.service";

import {
  vectorSearch
} from "./vector-search.service";

export const hybridSearch =
async (
  query: string
) => {

  const bm25Results =
    await bm25Search(query);

  const vectorResults =
    await vectorSearch(query);

  const merged =
    new Map<string, any>();

  /**
   * BM25 Results
   */
  for (
    const result
    of bm25Results
  ) {

    const id =
      result.document._id.toString();

    merged.set(
      id,
      {
        document:
          result.document,
        bm25Score:
          result.score,
        vectorScore: 0
      }
    );
  }

  /**
   * Vector Results
   */
  for (
    const result
    of vectorResults
  ) {

    const id =
      result.chunk._id.toString();

    if (
      merged.has(id)
    ) {

      merged.get(id)
        .vectorScore =
          result.score;

    } else {

      merged.set(
        id,
        {
          document:
            result.chunk,
          bm25Score: 0,
          vectorScore:
            result.score
        }
      );
    }
  }

  const finalResults =
    Array.from(
      merged.values()
    ).map(
      (item: any) => ({

        ...item,

        hybridScore:

          (
            item.bm25Score *
            0.5
          )

          +

          (
            item.vectorScore *
            0.5
          )
      })
    );

  finalResults.sort(
    (a, b) =>
      b.hybridScore -
      a.hybridScore
  );

  return finalResults.slice(
    0,
    10
  );
};