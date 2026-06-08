import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Backlog() {
  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState<any>(null);

  useEffect(() => {
    loadBacklog();
  }, []);

  const loadBacklog =
    async () => {
      try {
        const response =
          await api.get(
            "/backlog"
          );

        setData(
          response.data
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  const renderCard = (
    item: any
  ) => (
    <div
      key={item._id}
      className="
      bg-[#0D113D]
      border
      border-white/10
      rounded-xl
      p-4
      hover:border-pink-500/30
      transition
      "
    >
      <div className="flex justify-between items-start">
        <span
          className="
          px-2
          py-1
          rounded-lg
          text-xs
          bg-pink-500/20
          text-pink-300
          capitalize
          "
        >
          {item.classification}
        </span>

        <span
          className="
          px-2
          py-1
          rounded-lg
          text-xs
          bg-blue-500/20
          text-blue-300
          "
        >
          Score {item.priorityScore}
        </span>
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {item.content}
      </h3>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <div className="text-white/50 text-xs">
            Priority
          </div>

          <div className="capitalize">
            {item.priority}
          </div>
        </div>

        <div>
          <div className="text-white/50 text-xs">
            Complexity
          </div>

          <div>
            {item.complexityScore}
          </div>
        </div>

        <div>
          <div className="text-white/50 text-xs">
            Dev Hours
          </div>

          <div>
            {
              item.estimatedDevelopmentHours
            }
          </div>
        </div>

        <div>
          <div className="text-white/50 text-xs">
            Testing
          </div>

          <div>
            {
              item.estimatedTestingHours
            }
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-white">
        Loading backlog...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold">
          Release Planner
        </h1>

        <p className="text-white/60 mt-2">
          AI generated release
          planning based on
          priority and effort.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#12184A] rounded-xl p-5">
          <div className="text-white/50">
            Total Items
          </div>

          <div className="text-3xl font-bold mt-2">
            {
              data.summary
                .total
            }
          </div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5">
          <div className="text-white/50">
            Release 1
          </div>

          <div className="text-3xl font-bold mt-2 text-pink-400">
            {
              data.summary
                .release1
            }
          </div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5">
          <div className="text-white/50">
            Release 2
          </div>

          <div className="text-3xl font-bold mt-2 text-purple-400">
            {
              data.summary
                .release2
            }
          </div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5">
          <div className="text-white/50">
            Release 3
          </div>

          <div className="text-3xl font-bold mt-2 text-blue-400">
            {
              data.summary
                .release3
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-[#12184A] rounded-2xl p-5">
          <h2 className="text-xl font-bold text-pink-400 mb-4">
            Release 1
          </h2>

          <div className="space-y-4">
            {data.release1.map(
              renderCard
            )}
          </div>
        </div>

        <div className="bg-[#12184A] rounded-2xl p-5">
          <h2 className="text-xl font-bold text-purple-400 mb-4">
            Release 2
          </h2>

          <div className="space-y-4">
            {data.release2.map(
              renderCard
            )}
          </div>
        </div>

        <div className="bg-[#12184A] rounded-2xl p-5">
          <h2 className="text-xl font-bold text-blue-400 mb-4">
            Release 3
          </h2>

          <div className="space-y-4">
            {data.release3.map(
              renderCard
            )}
          </div>
        </div>

      </div>
    </div>
  );
}