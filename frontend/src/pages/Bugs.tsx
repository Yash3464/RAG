import { useState } from "react";
import { api } from "../services/api";

export default function Bugs() {
  const [bug, setBug] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);

  const analyzeBug =
    async () => {
      try {
        setLoading(true);

        const response =
          await api.post(
            "/bugs/analyze",
            { bug }
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
          Bug Input
        </h2>

        <textarea
          value={bug}
          onChange={(e) =>
            setBug(e.target.value)
          }
          rows={12}
          className="w-full bg-[#0D113D] rounded-xl p-4 border border-white/10"
          placeholder="Describe the bug..."
        />

        <button
          onClick={analyzeBug}
          disabled={loading}
          className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7]"
        >
          {loading
            ? "Analyzing..."
            : "Analyze Bug"}
        </button>
      </div>

      <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-4">
          Bug Analysis
        </h2>

        {!result && (
          <p className="text-white/60">
            Analyze a bug to see
            results.
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

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="text-white/60 text-sm">
                  Severity
                </div>

                <div className="mt-2 text-red-400 font-semibold capitalize">
                  {result.severity}
                </div>
              </div>

              <div className="bg-[#0D113D] rounded-xl p-4">
                <div className="text-white/60 text-sm">
                  Estimated Hours
                </div>

                <div className="mt-2 text-pink-400 font-semibold">
                  {result.estimatedHours}
                </div>
              </div>

            </div>

            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="font-semibold mb-3">
                Fix Plan
              </div>

              <ul className="space-y-2 list-disc ml-5">
                {result.fixPlan?.map(
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

            <div className="bg-[#0D113D] rounded-xl p-4">
              <div className="font-semibold mb-3">
                Test Cases
              </div>

              <ul className="space-y-2 list-disc ml-5">
                {result.testCases?.map(
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