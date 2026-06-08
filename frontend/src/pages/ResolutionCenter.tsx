import { useState } from "react";
import { api } from "../services/api";

export default function ResolutionCenter() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    try {
      setLoading(true);

      let response;

      const text = problem.toLowerCase();

      const bugKeywords = [
        "error",
        "crash",
        "bug",
        "500",
        "404",
        "login",
        "api",
        "exception",
        "fail",
      ];

      const isBug = bugKeywords.some((word) =>
        text.includes(word)
      );

      if (isBug) {
        response = await api.post(
          "/bugs/analyze",
          {
            bug: problem,
          }
        );

        setResult({
          type: "Bug",
          ...response.data.analysis,
        });
      } else {
        response = await api.post(
          "/issues/analyze",
          {
            issue: problem,
          }
        );

        setResult({
          type: "Issue",
          ...response.data.analysis,
        });
      }
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
          AI Resolution Center
        </h2>

        <textarea
          value={problem}
          onChange={(e) =>
            setProblem(e.target.value)
          }
          rows={12}
          className="w-full bg-[#0D113D] rounded-xl p-4 border border-white/10"
          placeholder="Describe any problem, issue, bug or operational challenge..."
        />

        <button
          onClick={analyze}
          disabled={loading}
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7]"
        >
          {loading
            ? "Analyzing..."
            : "Analyze Problem"}
        </button>
      </div>

      <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4">
          AI Analysis
        </h2>

        {!result && (
          <p className="text-white/60">
            Analyze a problem to see
            recommendations.
          </p>
        )}

        {result && (
          <div className="space-y-5">
            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="text-white/60 text-sm">
                Problem Type
              </div>

              <div className="mt-2 text-pink-400 font-semibold">
                {result.type}
              </div>
            </div>

            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="text-white/60 text-sm">
                Root Cause
              </div>

              <div className="mt-2">
                {result.rootCause}
              </div>
            </div>

            {result.businessImpact && (
              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="text-white/60 text-sm">
                  Business Impact
                </div>

                <div className="mt-2">
                  {result.businessImpact}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {result.priority && (
                <div className="bg-[#0D113D] rounded-xl p-4">
                  <div className="text-white/60 text-sm">
                    Priority
                  </div>

                  <div className="mt-2 text-pink-400 font-semibold">
                    {result.priority}
                  </div>
                </div>
              )}

              {result.severity && (
                <div className="bg-[#0D113D] rounded-xl p-4">
                  <div className="text-white/60 text-sm">
                    Severity
                  </div>

                  <div className="mt-2 text-red-400 font-semibold">
                    {result.severity}
                  </div>
                </div>
              )}

              {result.estimatedHours && (
                <div className="bg-[#0D113D] rounded-xl p-4">
                  <div className="text-white/60 text-sm">
                    Estimated Hours
                  </div>

                  <div className="mt-2 text-pink-400 font-semibold">
                    {result.estimatedHours}
                  </div>
                </div>
              )}

              {result.estimatedImprovement && (
                <div className="bg-[#0D113D] rounded-xl p-4">
                  <div className="text-white/60 text-sm">
                    Improvement
                  </div>

                  <div className="mt-2 text-green-400 font-semibold">
                    {result.estimatedImprovement}
                  </div>
                </div>
              )}
            </div>

            {result.fixPlan && (
              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="font-semibold mb-3">
                  Fix Plan
                </div>

                <ul className="space-y-2 list-disc ml-5">
                  {result.fixPlan.map(
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
            )}

            {result.testCases && (
              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="font-semibold mb-3">
                  Test Cases
                </div>

                <ul className="space-y-2 list-disc ml-5">
                  {result.testCases.map(
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
            )}

            {result.recommendations && (
              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="font-semibold mb-3">
                  Recommendations
                </div>

                <ul className="space-y-2 list-disc ml-5">
                  {result.recommendations.map(
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}