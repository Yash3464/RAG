import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard =
    async () => {
      try {
        const response =
          await api.get("/backlog");

        setData(
          response.data
        );
      } catch (error) {
        console.error(error);
      }
    };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setSearchResult(null);
      const response = await api.post("/ask", { question: searchQuery });
      setSearchResult(response.data);
    } catch (error) {
      console.error("Failed to query RAG search:", error);
    } finally {
      setSearching(false);
    }
  };

  if (!data) {
    return (
      <div>
        Loading Dashboard...
      </div>
    );
  }

  const allItems = [
    ...(data.release1 || []),
    ...(data.release2 || []),
    ...(data.release3 || []),
  ]
    .sort(
      (a: any, b: any) =>
        b.priorityScore -
        a.priorityScore
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-5xl font-bold">
          Project Memory AI
        </h1>

        <p className="text-white/60 mt-2">
          AI Powered Product Intelligence Platform
        </p>
      </div>

      {/* Global AI Search Console */}
      <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A39D8]/5 rounded-full blur-3xl pointer-events-none" />
        <h2 className="text-lg font-bold mb-3 text-white flex items-center gap-2">
          <span>🧠</span> Global AI Search Agent (Cross-Module RAG)
        </h2>
        <p className="text-white/60 text-xs mb-4">
          Query anything across uploaded documents, approved requirement master, draft backlogs, schemas, and APIs.
        </p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-[#0D113D] rounded-xl p-3.5 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none placeholder-white/20 text-xs"
            placeholder="E.g., What database schemas or APIs are impacted by Vendor KYC onboarding?"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-[#E238A7]/10 cursor-pointer"
          >
            {searching ? "Searching..." : "Search Project"}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResult && (
          <div className="mt-6 pt-6 border-t border-white/5 space-y-6 animate-fadeIn text-left">
            {/* Answer block */}
            <div className="bg-[#0D113D] border border-cyan-500/20 rounded-xl p-5 space-y-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">AI Answer Verdict</span>
              <p className="text-white/95 text-xs leading-relaxed whitespace-pre-wrap">{searchResult.answer}</p>
            </div>

            {/* Sources list */}
            {searchResult.sources && searchResult.sources.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Referenced Context Sources</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResult.sources.map((src: any, idx: number) => (
                    <div key={idx} className="bg-[#0D113D]/60 border border-white/5 rounded-lg p-3 text-xs flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-pink-400 truncate max-w-[80%]">{src.name}</span>
                          <span className="text-[8px] bg-white/5 border border-white/5 text-white/50 px-1.5 py-0.5 rounded capitalize">
                            {src.type}
                          </span>
                        </div>
                        <p className="text-white/60 text-[10px] line-clamp-2 leading-relaxed">{src.snippet}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom details: related components & suggested actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResult.relatedComponents && searchResult.relatedComponents.length > 0 && (
                <div className="bg-[#0D113D]/40 border border-white/5 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Impacted Components</span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResult.relatedComponents.map((comp: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-[#12184A] border border-white/5 text-white/80 font-mono text-[9px]">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.suggestedActions && searchResult.suggestedActions.length > 0 && (
                <div className="bg-[#0D113D]/40 border border-white/5 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Recommended Actions</span>
                  <ul className="text-[10px] text-cyan-300 list-disc ml-4 space-y-1">
                    {searchResult.suggestedActions.map((action: string, idx: number) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">

        <div className="bg-[#12184A] p-6 rounded-2xl">
          <div className="text-white/50">
            Knowledge Items
          </div>

          <div className="text-5xl font-bold mt-3">
            {data.summary.total}
          </div>
        </div>

        <div className="bg-[#12184A] p-6 rounded-2xl">
          <div className="text-white/50">
            Release 1
          </div>

          <div className="text-5xl font-bold text-pink-400 mt-3">
            {data.summary.release1}
          </div>
        </div>

        <div className="bg-[#12184A] p-6 rounded-2xl">
          <div className="text-white/50">
            Release 2
          </div>

          <div className="text-5xl font-bold text-purple-400 mt-3">
            {data.summary.release2}
          </div>
        </div>

        <div className="bg-[#12184A] p-6 rounded-2xl">
          <div className="text-white/50">
            Release 3
          </div>

          <div className="text-5xl font-bold text-cyan-400 mt-3">
            {data.summary.release3}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-6">

        <div className="bg-[#12184A] p-6 rounded-2xl">

          <h2 className="text-3xl font-bold mb-6">
            Platform Capabilities
          </h2>

          <div className="grid grid-cols-1 gap-3.5">
            {[
              { title: "Requirement Analysis", desc: "Extract specifications & trace architectures using advanced semantic parsing.", icon: "📋", color: "from-blue-600 to-cyan-500" },
              { title: "Duplicate Detection", desc: "Instantly cross-check and de-duplicate incoming product backlog requests.", icon: "🔄", color: "from-pink-600 to-rose-500" },
              { title: "Priority Scoring", desc: "Multi-vector priority metrics (Business, Compliance, Security, User, Dependency).", icon: "⚖️", color: "from-amber-500 to-yellow-500" },
              { title: "Effort Estimation", desc: "AI dev and testing estimates calculated automatically based on complexity.", icon: "⏱️", color: "from-purple-600 to-pink-500" },
              { title: "Backlog Planning", desc: "Algorithmic roadmapping for Releases 1, 2, and 3 based on effort penalties.", icon: "📅", color: "from-indigo-600 to-blue-500" },
              { title: "Bug Resolution AI", desc: "Auto-generate developer tasks and QA acceptance criteria from bug reports.", icon: "🐛", color: "from-red-600 to-pink-600" },
              { title: "Issue Resolution AI", desc: "Flag conflict risks, architectural impacts, and blocking requirements.", icon: "⚠️", color: "from-teal-600 to-emerald-500" }
            ].map((cap, idx) => (
              <div key={idx} className="group bg-[#0D113D]/60 border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-start gap-3 transition-all duration-300 hover:scale-[1.01] hover:bg-[#0D113D]">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cap.color} flex items-center justify-center text-sm shrink-0 shadow-lg shadow-black/10`}>
                  {cap.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-white text-xs group-hover:text-[#FF4FA3] transition-colors">{cap.title}</h3>
                  <p className="text-white/40 text-[10px] leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="bg-[#12184A] p-6 rounded-2xl">

          <h2 className="text-3xl font-bold mb-6">
            Top Priority Work
          </h2>

          <div className="space-y-4">

            {allItems.map(
              (item: any) => (
                <div
                  key={item._id}
                  className="
                  bg-[#0D113D]
                  rounded-xl
                  p-4
                  border
                  border-white/10
                  "
                >
                  <div className="font-semibold">
                    {item.content}
                  </div>

                  <div className="flex justify-between mt-3 text-sm text-white/60">
                    <span>
                      {item.classification}
                    </span>

                    <span>
                      Score:
                      {" "}
                      {
                        item.priorityScore
                      }
                    </span>
                  </div>
                </div>
              )
            )}

          </div>

        </div>

      </div>

      <div className="bg-[#12184A] p-6 rounded-2xl">

        <h2 className="text-3xl font-bold mb-4">
          Executive Summary
        </h2>

        <p className="text-white/80 leading-8">
          Project Memory AI transforms
          requirements, bugs, issues,
          business rules and change requests
          into structured organizational
          knowledge. The platform
          automatically classifies,
          prioritizes, estimates effort,
          detects duplicates and creates
          release plans using AI.
        </p>

      </div>

    </div>
  );
}