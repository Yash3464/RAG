import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Dashboard() {
  const [data, setData] =
    useState<any>(null);

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