import { useState } from "react";
import { api } from "../services/api";

export default function Issues() {
  const [issue, setIssue] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);

  const analyzeIssue =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.post(
            "/issues/analyze",
            { issue }
          );

        setResult(
          response.data.analysis
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="grid grid-cols-2 gap-8">

      <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4">
          Issue Input
        </h2>

        <textarea
          value={issue}
          onChange={(e) =>
            setIssue(
              e.target.value
            )
          }
          rows={12}
          className="w-full bg-[#0D113D] rounded-xl p-4 border border-white/10"
          placeholder="Describe the issue..."
        />

        <button
          onClick={analyzeIssue}
          disabled={loading}
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7]"
        >
          {loading
            ? "Analyzing..."
            : "Analyze Issue"}
        </button>
      </div>

      <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4">
          Issue Analysis
        </h2>

        {!result && (
          <p className="text-white/60">
            Analyze an issue to
            see results.
          </p>
        )}

        {result && (
          <div className="space-y-5">

            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="text-white/60 text-sm">
                Root Cause
              </div>

              <div className="mt-2">
                {result.rootCause}
              </div>
            </div>

            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="text-white/60 text-sm">
                Business Impact
              </div>

              <div className="mt-2">
                {
                  result.businessImpact
                }
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="text-white/60 text-sm">
                  Priority
                </div>

                <div className="mt-2 text-pink-400 font-semibold capitalize">
                  {result.priority}
                </div>
              </div>

              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="text-white/60 text-sm">
                  Improvement
                </div>

                <div className="mt-2 text-green-400 font-semibold">
                  {
                    result.estimatedImprovement
                  }
                </div>
              </div>

            </div>

            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="font-semibold mb-3">
                Recommendations
              </div>

              <ul className="space-y-2 list-disc ml-5">
                {result.recommendations?.map(
                  (
                    item: string,
                    index: number
                  ) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}