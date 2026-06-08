import {hybridSearch} from "./hybrid-search.service";
import {getGraphMetrics} from "./graph-dashboard.service";

export const buildAgentContext =
async (
  query: string
) => {

  const searchResults =
    await hybridSearch(
      query
    );

  const graphMetrics =
    await getGraphMetrics();

  return {
    searchResults,
    graphMetrics
  };
};