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
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [detailedReq, setDetailedReq] = useState<any>(null);

  // Knowledge Graph inside Preview Modal
  const [graphData, setGraphData] = useState<any>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Helper to compute node positions dynamically in radial/star pattern for preview modal
  const computeNodePositions = (nodes: any[], centralId: string) => {
    const radius = 220; // Expanded radius to prevent clustering
    const centerX = 400; // Center X for 800px SVG canvas
    const centerY = 250; // Center Y for 500px SVG canvas
    const otherNodes = nodes.filter((n) => n.nodeId !== centralId);
    
    return nodes.map((node) => {
      if (node.nodeId === centralId) {
        return { ...node, x: centerX, y: centerY, isCentral: true };
      }

      const angle = (2 * Math.PI * otherNodes.indexOf(node)) / otherNodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        isCentral: false,
      };
    });
  };

  const getNodePos = (node: any, centralId: string) => {
    if (nodePositions[node.nodeId]) {
      return nodePositions[node.nodeId];
    }
    const computed = computeNodePositions(graphData?.nodes || [], centralId);
    const matched = computed.find((n) => n.nodeId === node.nodeId);
    return matched ? { x: matched.x, y: matched.y } : { x: 400, y: 250 };
  };

  const getNodeColor = (type: string, isCentral: boolean) => {
    if (isCentral) return "#FF4FA3";
    switch (type) {
      case "requirement": return "#7A39D8";
      case "business_rule": return "#39A6D8";
      case "task": return "#D8C639";
      case "change_request": return "#D87A39";
      case "bug": return "#EF4444";
      case "issue": return "#F59E0B";
      default: return "#A1A1AA";
    }
  };

  const getEdgeColor = (type: string) => {
    switch (type) {
      case "depends_on": return "#D8C639"; // Yellow
      case "blocks": return "#EF4444"; // Red
      case "impacts": return "#D87A39"; // Orange
      case "relates_to": return "#39A6D8"; // Blue
      default: return "#4B5563"; // Dark grey
    }
  };

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

  const handleOpenPreview = async (item: any) => {
    setPreviewItem(item);
    setGraphData(null);
    setDetailedReq(null);
    try {
      setLoadingGraph(true);
      const response = await api.get(`/graph/${item._id}`);
      setGraphData(response.data.graph);
      if (response.data.detailedRequirement) {
        setDetailedReq(response.data.detailedRequirement);
      }
      if (response.data.graph && response.data.graph.nodes) {
        const computed = computeNodePositions(response.data.graph.nodes, response.data.graph.centralNode.nodeId);
        const positions: Record<string, { x: number; y: number }> = {};
        computed.forEach((node) => {
          positions[node.nodeId] = { x: node.x, y: node.y };
        });
        setNodePositions(positions);
      }
    } catch (err) {
      console.error("Failed to load local knowledge graph:", err);
    } finally {
      setLoadingGraph(false);
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
          <button
            onClick={() => handleOpenPreview(item)}
            className="mt-3 text-[10px] text-[#FF4FA3] hover:text-[#FF4FA3]/80 font-bold flex items-center gap-1 cursor-pointer transition select-none"
          >
            🔍 Preview Details & History
          </button>
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

      {/* Detail Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-[#070926]/80 backdrop-blur-xs flex justify-center items-center z-[100] animate-fadeIn p-4">
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A39D8]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📄</span> Backlog Item Detail
                </h3>
                <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider block mt-1">ID: {previewItem._id}</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-white/40 hover:text-white transition font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Specifications / Content & Revision History */}
              <div className="space-y-6 flex flex-col justify-start">
                {/* Full Text Content */}
                <div className="space-y-1.5">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Full Specification / Content</span>
                  <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5 max-h-[380px] overflow-y-auto text-xs text-white/90 leading-relaxed whitespace-pre-wrap select-text custom-scrollbar">
                    {detailedReq ? detailedReq.refinedRequirement : previewItem.content}
                  </div>
                </div>

                {detailedReq && detailedReq.assumptions && detailedReq.assumptions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Assumptions</span>
                    <div className="bg-[#0D113D]/60 rounded-xl p-4 border border-white/5 max-h-[150px] overflow-y-auto text-xs text-white/80 custom-scrollbar">
                      <ul className="list-disc ml-4 space-y-1">
                        {detailedReq.assumptions.map((ass: string, idx: number) => (
                          <li key={idx}>{ass}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {detailedReq && detailedReq.dependencies && detailedReq.dependencies.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Dependencies</span>
                    <div className="bg-[#0D113D]/60 rounded-xl p-4 border border-white/5 max-h-[150px] overflow-y-auto text-xs text-white/80 custom-scrollbar">
                      <ul className="list-disc ml-4 space-y-1">
                        {detailedReq.dependencies.map((dep: string, idx: number) => (
                          <li key={idx}>{dep}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Version History */}
                {previewItem.versions && previewItem.versions.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">Revision History</span>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                      {previewItem.versions.map((v: any, index: number) => (
                        <div key={index} className="bg-[#0D113D] p-3 rounded-xl border border-white/5 text-xs flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="font-bold text-white">Version {v.versionNumber}: {v.title}</div>
                            <p className="text-white/60 leading-relaxed text-[11px] max-h-[80px] overflow-y-auto pr-1 custom-scrollbar whitespace-pre-wrap mt-1">{v.content}</p>
                          </div>
                          <div className="text-[10px] text-right shrink-0">
                            <span className="text-pink-400 block font-semibold">{v.modifiedBy}</span>
                            <span className="text-white/30 block mt-1">{new Date(v.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Metadata, Hours Breakdown, Knowledge Graph */}
              <div className="space-y-6 flex flex-col justify-start">
                {/* Effort & Classification grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase font-semibold block">Classification</span>
                    <span className="font-bold text-xs text-pink-400 capitalize mt-1 block">{previewItem.classification}</span>
                  </div>
                  <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase font-semibold block">Priority (Score)</span>
                    <span className="font-bold text-xs text-orange-400 capitalize mt-1 block">
                      {previewItem.priority} ({previewItem.priorityScore})
                    </span>
                  </div>
                  <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase font-semibold block">Complexity</span>
                    <span className="font-bold text-xs text-cyan-400 mt-1 block">{previewItem.complexityScore || 3}/5</span>
                  </div>
                  <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                    <span className="text-white/40 text-[9px] uppercase font-semibold block">Total Effort</span>
                    <span className="font-bold text-xs text-green-400 mt-1 block">
                      {(previewItem.estimatedDevelopmentHours || 0) + (previewItem.estimatedTestingHours || 0)} hrs
                    </span>
                  </div>
                </div>

                {/* Detailed hours breakdown */}
                <div className="bg-[#0D113D]/40 p-4 rounded-xl border border-white/5 space-y-3">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">Estimated Hours Breakdown</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-white/50 block text-[10px]">Dev Hours</span>
                      <span className="text-white font-semibold block mt-1">{previewItem.estimatedDevelopmentHours || 0} hrs</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px]">Testing Hours</span>
                      <span className="text-white font-semibold block mt-1">{previewItem.estimatedTestingHours || 0} hrs</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px]">Review Hours</span>
                      <span className="text-white font-semibold block mt-1">{previewItem.estimatedReviewHours || 0} hrs</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px]">Documentation</span>
                      <span className="text-white font-semibold block mt-1">{previewItem.estimatedDocumentationHours || 0} hrs</span>
                    </div>
                  </div>
                </div>

                {/* Local Knowledge Graph section */}
                <div className="bg-[#0D113D]/40 p-4 rounded-xl border border-white/5 space-y-3 flex-grow flex flex-col min-h-[600px]">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">Context Dependency Traceability Map</span>
                    {loadingGraph && (
                      <span className="text-[10px] uppercase text-[#FF4FA3] font-bold tracking-wider animate-pulse">Loading Graph...</span>
                    )}
                  </div>
                  <div className="bg-[#0D113D] border border-white/10 rounded-xl overflow-hidden flex-grow select-none relative min-h-[540px]">
                    {graphData ? (
                      graphData.nodes?.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-white/30 italic">No dependencies trace found.</div>
                      ) : (
                        <svg width="100%" height="100%" viewBox="0 0 800 500" className="w-full h-full">
                          <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Draw relationship edges (lines) */}
                          {graphData.edges?.map((edge: any, idx: number) => {
                            const sourceNode = graphData.nodes.find((n: any) => n.nodeId === edge.sourceNodeId);
                            const targetNode = graphData.nodes.find((n: any) => n.nodeId === edge.targetNodeId);
                            if (!sourceNode || !targetNode) return null;

                            const sPos = getNodePos(sourceNode, graphData.centralNode.nodeId);
                            const tPos = getNodePos(targetNode, graphData.centralNode.nodeId);

                            return (
                              <g key={idx}>
                                <line
                                  x1={sPos.x}
                                  y1={sPos.y}
                                  x2={tPos.x}
                                  y2={tPos.y}
                                  stroke={getEdgeColor(edge.relationshipType)}
                                  strokeWidth={1.5}
                                  strokeDasharray={edge.relationshipType === "depends_on" ? "3" : "0"}
                                  className="opacity-60"
                                />
                                <text
                                  x={(sPos.x + tPos.x) / 2}
                                  y={(sPos.y + tPos.y) / 2 - 4}
                                  fill="#9ca3af"
                                  fontSize="6"
                                  textAnchor="middle"
                                  className="font-bold select-none font-mono"
                                >
                                  {edge.relationshipType}
                                </text>
                              </g>
                            );
                          })}

                          {/* Draw knowledge nodes */}
                          {graphData.nodes?.map((node: any) => {
                            const pos = getNodePos(node, graphData.centralNode.nodeId);
                            const isCentral = node.nodeId === graphData.centralNode.nodeId;

                            return (
                              <g key={node.nodeId}>
                                <rect
                                  x={pos.x - 65}
                                  y={pos.y - 16}
                                  width={130}
                                  height={32}
                                  rx={8}
                                  fill={getNodeColor(node.nodeType, isCentral)}
                                  stroke="rgba(255, 255, 255, 0.15)"
                                  strokeWidth={1}
                                  filter={isCentral ? "url(#glow)" : ""}
                                />
                                <text
                                  x={pos.x}
                                  y={pos.y + 4}
                                  textAnchor="middle"
                                  fill="#FFFFFF"
                                  fontSize="8"
                                  className="font-bold select-none pointer-events-none tracking-wide"
                                >
                                  {node.title && node.title.length > 25 ? `${node.title.substring(0, 22)}...` : node.title}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      )
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-white/30 italic">
                        {loadingGraph ? "Generating traceability graph..." : "Traceability graph not loaded."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 text-white font-bold text-xs transition cursor-pointer shadow-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}