import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Backlog() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeSlide, setActiveSlide] = useState<"releases" | "completed">("releases");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const userStr = localStorage.getItem("brained_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadBacklog();
  }, []);

  const loadBacklog = async () => {
    try {
      const response = await api.get("/backlog");
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const handleDropdownChange = async (itemId: string, value: string) => {
    if (value === "remove") {
      setDeleteTargetId(itemId);
    } else {
      try {
        setLoading(true);
        if (value === "completed") {
          await api.put(`/backlog/${itemId}/status`, { status: "completed" });
        } else if (value === "auto") {
          await api.put(`/backlog/${itemId}/status`, { status: "approved", releaseOverride: null });
        } else if (value === "release1" || value === "release2" || value === "release3") {
          await api.put(`/backlog/${itemId}/status`, { status: "approved", releaseOverride: value });
        } else {
          await api.put(`/backlog/${itemId}/status`, { status: value });
        }
        await loadBacklog();
      } catch (error) {
        console.error("Failed to update status:", error);
        setLoading(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setLoading(true);
      await api.delete(`/backlog/${deleteTargetId}`);
      setDeleteTargetId(null);
      await loadBacklog();
    } catch (error) {
      console.error("Failed to delete backlog item:", error);
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData("text/plain", itemId);
    setDraggedItemId(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain") || draggedItemId;
    setDragOverColumn(null);
    setDraggedItemId(null);
    if (!itemId) return;

    try {
      setLoading(true);
      if (columnId === "completed") {
        await api.put(`/backlog/${itemId}/status`, { status: "completed" });
      } else {
        await api.put(`/backlog/${itemId}/status`, { status: "approved", releaseOverride: columnId });
      }
      await loadBacklog();
    } catch (error) {
      console.error("Failed to update status on drop:", error);
      setLoading(false);
    }
  };

  const filteredCompletedTasks = data?.completed
    ? data.completed.filter((item: any) => {
        if (priorityFilter === "all") return true;
        return item.priority?.toLowerCase() === priorityFilter.toLowerCase();
      })
    : [];

  const renderCard = (item: any) => {
    const p = item.priority?.toLowerCase();
    const isCompleted = item.status === "completed";
    let borderStyle = "border-blue-500/20 hover:border-blue-500/40";
    let badgeStyle = "bg-blue-500/20 text-blue-300 border border-blue-500/30";

    if (p === "critical") {
      borderStyle = "border-red-500/20 hover:border-red-500/40";
      badgeStyle = "bg-red-500/20 text-red-300 border border-red-500/30";
    } else if (p === "high") {
      borderStyle = "border-orange-500/20 hover:border-orange-500/40";
      badgeStyle = "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    } else if (p === "medium") {
      borderStyle = "border-yellow-500/20 hover:border-yellow-500/40";
      badgeStyle = "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    }

    return (
      <div
        key={item._id}
        draggable={isAdmin}
        onDragStart={(e) => handleDragStart(e, item._id)}
        onDragEnd={handleDragEnd}
        className={`bg-[#0D113D] border ${borderStyle} rounded-xl p-4 transition flex flex-col justify-between ${
          isAdmin ? "cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-pink-500/5" : ""
        }`}
      >
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize shrink-0 ${badgeStyle}`}>
              {item.classification}
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-300 shrink-0">
                Score {item.priorityScore}
              </span>
              <select
                value={isCompleted ? "completed" : (item.releaseOverride || "auto")}
                onChange={(e) => handleDropdownChange(item._id, e.target.value)}
                className={`bg-[#12184A] text-[10px] text-white border rounded-lg px-2 py-1 focus:outline-none font-semibold cursor-pointer ${
                  isCompleted ? "border-green-500/20 focus:border-green-400" : "border-white/10 focus:border-[#FF4FA3]"
                }`}
              >
                {isCompleted ? (
                  <>
                    <option value="completed">Completed</option>
                    <option value="approved">Active</option>
                    {isAdmin && <option value="remove">🗑️ Remove</option>}
                  </>
                ) : (
                  <>
                    <option value="auto">Active</option>
                    <option value="completed">Completed</option>
                    {isAdmin && <option value="remove">🗑️ Remove</option>}
                  </>
                )}
              </select>
            </div>
          </div>

          <h3 className={`mt-4 font-semibold text-sm line-clamp-3 ${isCompleted ? "text-white/60 line-through decoration-white/20" : "text-white"}`}>
            {item.content}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-white/50 text-[10px]">Priority</div>
            <div className="capitalize text-xs text-white/90">{item.priority}</div>
          </div>

          <div>
            <div className="text-white/50 text-[10px]">Complexity</div>
            <div className="text-xs text-white/90">{item.complexityScore}</div>
          </div>

          <div>
            <div className="text-white/50 text-[10px]">Dev Hours</div>
            <div className="text-xs text-white/90">{item.estimatedDevelopmentHours}</div>
          </div>

          <div>
            <div className="text-white/50 text-[10px]">Testing</div>
            <div className="text-xs text-white/90">{item.estimatedTestingHours}</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="text-white flex justify-center items-center h-64 font-semibold">
        <span className="animate-pulse">Loading backlog planner...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 relative">
      
      {/* Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-[#070926]/80 backdrop-blur-xs flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span>⚠️</span> Confirm Removal
            </h3>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              Are you sure you want to remove the requirement? This action is permanent and will delete the item and all its associated tasks, graph edges, and review data.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-red-600/10"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Notification Banner */}
      {!isAdmin && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <span>💡</span> Employee Workspace: You can change task statuses via card dropdown selectors. Administrative privileges are required to manually drag-and-drop cards or remove items.
        </div>
      )}

      {/* Header section with toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            Release Planner
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            AI generated release planning based on priority, dependencies, and effort.
          </p>
        </div>

        {/* Sliding Panel Switcher (Visible on all screens) */}
        <div className="flex bg-[#12184A] p-1 rounded-xl border border-white/5 shadow-xl shrink-0 w-full md:w-auto">
          <button
            onClick={() => setActiveSlide("releases")}
            className={`flex-1 md:flex-initial py-2 px-5 rounded-lg font-semibold text-xs transition-all duration-300 cursor-pointer ${
              activeSlide === "releases"
                ? "bg-gradient-to-r from-[#7A39D8] to-[#E238A7] text-white shadow-lg shadow-[#E238A7]/10"
                : "text-white/60 hover:text-white"
            }`}
          >
            📋 Active Releases
          </button>
          <button
            onClick={() => setActiveSlide("completed")}
            className={`flex-1 md:flex-initial py-2 px-5 rounded-lg font-semibold text-xs transition-all duration-300 cursor-pointer ${
              activeSlide === "completed"
                ? "bg-gradient-to-r from-[#7A39D8] to-[#E238A7] text-white shadow-lg shadow-[#E238A7]/10"
                : "text-white/60 hover:text-white"
            }`}
          >
            ✅ Completed Tasks ({data?.summary?.completed || 0})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#12184A] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/50 text-xs">Total Items</div>
          <div className="text-3xl font-bold mt-2 text-white">
            {(data?.summary?.total || 0) + (data?.summary?.completed || 0)}
          </div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/50 text-xs">Release 1</div>
          <div className="text-3xl font-bold mt-2 text-pink-400">{data?.summary?.release1}</div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/50 text-xs">Release 2</div>
          <div className="text-3xl font-bold mt-2 text-purple-400">{data?.summary?.release2}</div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/50 text-xs">Release 3</div>
          <div className="text-3xl font-bold mt-2 text-blue-400">{data?.summary?.release3}</div>
        </div>

        <div className="bg-[#12184A] rounded-xl p-5 border border-green-500/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="text-white/50 font-semibold text-green-400/80 text-xs">Completed Tasks</div>
          <div className="text-3xl font-bold mt-2 text-green-400">{data?.summary?.completed || 0}</div>
        </div>
      </div>

      {/* Main Board / Kanban Layout */}
      <div className="relative min-h-[400px]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-[#0D113D]/50 backdrop-blur-xs flex justify-center items-center z-50 rounded-2xl">
            <span className="text-pink-500 font-semibold text-sm animate-pulse">Updating Backlog...</span>
          </div>
        )}

        {activeSlide === "releases" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Release 1 Column */}
            <div
              onDragOver={isAdmin ? (e) => handleDragOver(e, "release1") : undefined}
              onDragLeave={isAdmin ? handleDragLeave : undefined}
              onDrop={isAdmin ? (e) => handleDrop(e, "release1") : undefined}
              className={`bg-[#12184A] rounded-2xl p-5 border transition-all duration-200 shadow-xl flex flex-col ${
                dragOverColumn === "release1"
                  ? "border-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.2)] bg-[#151c57]"
                  : "border-white/5"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-pink-400 flex items-center gap-2">
                  <span>🚀</span> Release 1
                </h2>
                <span className="text-xs bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full font-semibold">
                  {data?.release1?.length || 0} tasks
                </span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-[150px]">
                {data?.release1 && data.release1.length > 0 ? (
                  data.release1.map(renderCard)
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl py-12">
                    <p className="text-white/30 text-xs italic text-center px-4">Drag tasks here for Release 1</p>
                  </div>
                )}
              </div>
            </div>

            {/* Release 2 Column */}
            <div
              onDragOver={isAdmin ? (e) => handleDragOver(e, "release2") : undefined}
              onDragLeave={isAdmin ? handleDragLeave : undefined}
              onDrop={isAdmin ? (e) => handleDrop(e, "release2") : undefined}
              className={`bg-[#12184A] rounded-2xl p-5 border transition-all duration-200 shadow-xl flex flex-col ${
                dragOverColumn === "release2"
                  ? "border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.2)] bg-[#151c57]"
                  : "border-white/5"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-purple-400 flex items-center gap-2">
                  <span>⚡</span> Release 2
                </h2>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                  {data?.release2?.length || 0} tasks
                </span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-[150px]">
                {data?.release2 && data.release2.length > 0 ? (
                  data.release2.map(renderCard)
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl py-12">
                    <p className="text-white/30 text-xs italic text-center px-4">Drag tasks here for Release 2</p>
                  </div>
                )}
              </div>
            </div>

            {/* Release 3 Column */}
            <div
              onDragOver={isAdmin ? (e) => handleDragOver(e, "release3") : undefined}
              onDragLeave={isAdmin ? handleDragLeave : undefined}
              onDrop={isAdmin ? (e) => handleDrop(e, "release3") : undefined}
              className={`bg-[#12184A] rounded-2xl p-5 border transition-all duration-200 shadow-xl flex flex-col ${
                dragOverColumn === "release3"
                  ? "border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.2)] bg-[#151c57]"
                  : "border-white/5"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-blue-400 flex items-center gap-2">
                  <span>🛡️</span> Release 3
                </h2>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                  {data?.release3?.length || 0} tasks
                </span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-[150px]">
                {data?.release3 && data.release3.length > 0 ? (
                  data.release3.map(renderCard)
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl py-12">
                    <p className="text-white/30 text-xs italic text-center px-4">Drag tasks here for Release 3</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Slide 2: Completed Tasks slide */
          <div className="bg-[#12184A] rounded-2xl p-6 border border-white/5 shadow-xl animate-fadeIn">
            {/* Header of Completed Panel with Priority Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/5 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                  <span>✅</span> Completed Requirements & Tasks
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  Items that have been marked as completed. You can restore them back to active release planning or remove them completely.
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center space-x-2">
                  <span className="text-white/50 text-xs whitespace-nowrap">Priority Filter:</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-[#0D113D] text-xs text-white border border-white/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-green-400 cursor-pointer font-semibold"
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🔵 Low</option>
                  </select>
                </div>
                <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full font-semibold font-mono shrink-0">
                  {filteredCompletedTasks.length} Items
                </span>
              </div>
            </div>

            {filteredCompletedTasks && filteredCompletedTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompletedTasks.map(renderCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">📁</span>
                <p className="text-white/40 text-sm italic">No completed tasks match this filter.</p>
                <p className="text-white/20 text-xs mt-1">
                  Adjust the filter or complete more tasks from the Active Releases slide.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}