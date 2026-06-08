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

          <div className="space-y-4">

            <div>✅ Requirement Analysis</div>

            <div>✅ Duplicate Detection</div>

            <div>✅ Priority Scoring</div>

            <div>✅ Effort Estimation</div>

            <div>✅ Backlog Planning</div>

            <div>✅ Bug Resolution AI</div>

            <div>✅ Issue Resolution AI</div>

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