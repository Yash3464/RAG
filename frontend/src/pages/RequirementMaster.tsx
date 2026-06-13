import { useEffect, useState } from "react";
import { api } from "../services/api";

interface ApprovedRequirement {
  _id: string;
  requirementCode: string;
  title: string;
  refinedRequirement: string;
  assumptions: string[];
  dependencies: string[];
  businessRules: string[];
  version: number;
  status: string;
  createdAt: string;
}

interface ReviewDraft {
  _id: string;
  journalId: string;
  status: string;
  version: number;
  userComments: string;
  analysis: {
    missingInformation: string[];
    ambiguities: string[];
    assumptions: string[];
    dependencies: string[];
    edgeCases: string[];
    conflicts: any[];
    functionalRequirements: string[];
    nonFunctionalRequirements: string[];
    clarificationQuestions: string[];
    refinedRequirement: string;
  };
  createdAt: string;
}

const parseMermaid = (text: string) => {
  const nodesMap: Record<string, { id: string; label: string }> = {};
  const edges: { source: string; target: string }[] = [];

  const lines = text.split("\n");
  
  // 1. Extract nodes
  lines.forEach(line => {
    const nodeRegex = /([A-Za-z0-9_]+)\[(.*?)\]/g;
    let match;
    while ((match = nodeRegex.exec(line)) !== null) {
      const id = match[1];
      const label = match[2];
      nodesMap[id] = { id, label };
    }
  });

  // 2. Extract edges
  lines.forEach(line => {
    if (line.includes("-->")) {
      const parts = line.split("-->");
      for (let i = 0; i < parts.length - 1; i++) {
        const sourcePart = parts[i].trim();
        const targetPart = parts[i+1].trim();

        const sourceIdMatch = sourcePart.match(/^([A-Za-z0-9_]+)/);
        const targetIdMatch = targetPart.match(/^([A-Za-z0-9_]+)/);

        if (sourceIdMatch && targetIdMatch) {
          const source = sourceIdMatch[1];
          const target = targetIdMatch[1];
          edges.push({ source, target });

          if (!nodesMap[source]) {
            nodesMap[source] = { id: source, label: source };
          }
          if (!nodesMap[target]) {
            nodesMap[target] = { id: target, label: target };
          }
        }
      }
    }
  });

  return {
    nodes: Object.values(nodesMap),
    edges
  };
};

export default function RequirementMaster() {
  const [activeTab, setActiveTab] = useState<"approved" | "reviews">("approved");
  const [approvedList, setApprovedList] = useState<ApprovedRequirement[]>([]);
  const [reviewsList, setReviewsList] = useState<ReviewDraft[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view states
  const [selectedApprovedId, setSelectedApprovedId] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  
  // FRD cache state
  const [frdData, setFrdData] = useState<any>(null);
  const [frdTasks, setFrdTasks] = useState<any[]>([]);
  const [loadingFrd, setLoadingFrd] = useState(false);
  const [frdTab, setFrdTab] = useState<"intro" | "stories" | "rules" | "diagram" | "tasks">("intro");

  // Dynamic Impact Analysis state
  const [impactData, setImpactData] = useState<any>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  // PM Modals
  const [showCommentModal, setShowCommentModal] = useState<"change" | "refine" | null>(null);
  const [commentText, setCommentText] = useState("");

  // Interactive flowchart state
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<any[]>([]);
  const [workflowPositions, setWorkflowPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedWorkflowNodeId, setDraggedWorkflowNodeId] = useState<string | null>(null);
  const [showRawMermaid, setShowRawMermaid] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<"hierarchical" | "horizontal" | "vertical">("hierarchical");

  const userStr = localStorage.getItem("brained_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFrdData(null);
      setImpactData(null);
      setSelectedApprovedId(null);
      setSelectedReviewId(null);

      if (activeTab === "approved") {
        const response = await api.get("/requirements-master");
        setApprovedList(response.data.requirements);
      } else {
        const response = await api.get("/reviews");
        // Only show pending or change_requested review drafts
        setReviewsList(response.data.reviews.filter((r: any) => r.status !== "approved"));
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFrd = async (reqMasterId: string) => {
    try {
      setLoadingFrd(true);
      setFrdData(null);
      setFrdTasks([]);
      setWorkflowNodes([]);
      setWorkflowEdges([]);
      setWorkflowPositions({});
      setShowRawMermaid(false);

      const response = await api.get(`/frd/${reqMasterId}`);
      const frd = response.data.frd;
      setFrdData(frd);
      setFrdTasks(response.data.tasks || []);

      if (frd && frd.workflowDiagram) {
        const parsed = parseMermaid(frd.workflowDiagram);
        setWorkflowNodes(parsed.nodes);
        setWorkflowEdges(parsed.edges);
      }
    } catch (error) {
      console.error("Failed to fetch FRD details:", error);
    } finally {
      setLoadingFrd(false);
    }
  };

  const getNodeType = (label: string) => {
    const lower = label.toLowerCase();
    if (
      lower.includes("ai") ||
      lower.includes("llm") ||
      lower.includes("analyze") ||
      lower.includes("generate") ||
      lower.includes("intelligence") ||
      lower.includes("model") ||
      lower.includes("prompt") ||
      lower.includes("spark")
    ) {
      return {
        type: "AI",
        color: "#FF4FA3",
        icon: "🧠",
        bg: "rgba(255, 79, 163, 0.15)",
        badge: "AI Service",
      };
    }
    if (
      lower.includes("db") ||
      lower.includes("database") ||
      lower.includes("save") ||
      lower.includes("store") ||
      lower.includes("record") ||
      lower.includes("backlog") ||
      lower.includes("repository") ||
      lower.includes("insert") ||
      lower.includes("write") ||
      lower.includes("cache")
    ) {
      return {
        type: "DB",
        color: "#00F0FF",
        icon: "🛢️",
        bg: "rgba(0, 240, 255, 0.15)",
        badge: "Database",
      };
    }
    if (
      lower.includes("user") ||
      lower.includes("admin") ||
      lower.includes("view") ||
      lower.includes("page") ||
      lower.includes("portal") ||
      lower.includes("click") ||
      lower.includes("screen") ||
      lower.includes("select") ||
      lower.includes("input") ||
      lower.includes("form") ||
      lower.includes("dashboard")
    ) {
      return {
        type: "UI",
        color: "#FFC700",
        icon: "💻",
        bg: "rgba(255, 199, 0, 0.15)",
        badge: "User Interface",
      };
    }
    if (
      lower.includes("notification") ||
      lower.includes("email") ||
      lower.includes("send") ||
      lower.includes("sms") ||
      lower.includes("payment") ||
      lower.includes("api") ||
      lower.includes("external") ||
      lower.includes("webhook") ||
      lower.includes("integration")
    ) {
      return {
        type: "API",
        color: "#C084FC",
        icon: "🔌",
        bg: "rgba(192, 132, 252, 0.15)",
        badge: "Integration",
      };
    }
    return {
      type: "PROCESS",
      color: "#38BDF8",
      icon: "⚙️",
      bg: "rgba(56, 189, 248, 0.15)",
      badge: "Process Step",
    };
  };

  useEffect(() => {
    if (workflowNodes.length === 0) return;

    // 1. Build adjacency list and in-degrees
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    workflowNodes.forEach((n) => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    workflowEdges.forEach((e) => {
      if (adj[e.source]) {
        adj[e.source].push(e.target);
      }
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target]++;
      }
    });

    // 2. Assign ranks/layers
    const layers: Record<string, number> = {};
    workflowNodes.forEach((n) => {
      layers[n.id] = 0;
    });

    let queue = workflowNodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    if (queue.length === 0 && workflowNodes.length > 0) {
      queue = [workflowNodes[0].id];
    }

    const visited = new Set<string>();
    const q = [...queue];
    q.forEach((id) => {
      layers[id] = 0;
      visited.add(id);
    });

    let head = 0;
    while (head < q.length) {
      const curr = q[head++];
      const currLayer = layers[curr];
      (adj[curr] || []).forEach((nxt) => {
        layers[nxt] = Math.max(layers[nxt] || 0, currLayer + 1);
        if (!visited.has(nxt)) {
          visited.add(nxt);
          q.push(nxt);
        }
      });
    }

    // 3. Group by layer
    const nodesByLayer: Record<number, string[]> = {};
    workflowNodes.forEach((n) => {
      const l = layers[n.id] || 0;
      if (!nodesByLayer[l]) nodesByLayer[l] = [];
      nodesByLayer[l].push(n.id);
    });

    const maxLayer = Math.max(...Object.keys(nodesByLayer).map(Number), 0);

    // 4. Calculate Positions
    const newPositions: Record<string, { x: number; y: number }> = {};
    const canvasWidth = 1200;

    if (layoutDirection === "hierarchical") {
      const layerHeight = 120;
      for (let l = 0; l <= maxLayer; l++) {
        const nodeIds = nodesByLayer[l] || [];
        const count = nodeIds.length;
        nodeIds.forEach((id, index) => {
          const x = (canvasWidth / (count + 1)) * (index + 1);
          const y = 60 + l * layerHeight;
          newPositions[id] = { x, y };
        });
      }
    } else if (layoutDirection === "horizontal") {
      const layerWidth = 240;
      let maxCount = 1;
      for (let l = 0; l <= maxLayer; l++) {
        maxCount = Math.max(maxCount, (nodesByLayer[l] || []).length);
      }
      const canvasHeight = Math.max(400, maxCount * 120);

      for (let l = 0; l <= maxLayer; l++) {
        const nodeIds = nodesByLayer[l] || [];
        const count = nodeIds.length;
        nodeIds.forEach((id, index) => {
          const x = 120 + l * layerWidth;
          const y = (canvasHeight / (count + 1)) * (index + 1);
          newPositions[id] = { x, y };
        });
      }
    } else {
      // Snake wrapping layout (Grid layout that wraps back and forth)
      const cols = 3;
      const colWidth = 280;
      const rowHeight = 130;
      const startX = 320;
      const startY = 80;

      const orderedIds = q.length > 0 ? q : workflowNodes.map((n) => n.id);
      
      orderedIds.forEach((id, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const isReversed = row % 2 === 1;
        const actualCol = isReversed ? cols - 1 - col : col;
        
        newPositions[id] = {
          x: startX + actualCol * colWidth,
          y: startY + row * rowHeight,
        };
      });
    }

    setWorkflowPositions(newPositions);
  }, [workflowNodes, workflowEdges, layoutDirection]);

  const svgWidth = Math.max(1200, ...Object.values(workflowPositions).map(p => p.x + 100));
  const svgHeight = Math.max(500, ...Object.values(workflowPositions).map(p => p.y + 60));

  const handleWorkflowPointerDown = (nodeId: string) => {
    setDraggedWorkflowNodeId(nodeId);
  };

  const handleWorkflowPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedWorkflowNodeId) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const y = ((e.clientY - rect.top) / rect.height) * svgHeight;
    const boundedX = Math.max(100, Math.min(svgWidth - 100, x));
    const boundedY = Math.max(40, Math.min(svgHeight - 40, y));

    setWorkflowPositions((prev) => ({
      ...prev,
      [draggedWorkflowNodeId]: { x: boundedX, y: boundedY },
    }));
  };

  const handleWorkflowPointerUp = () => {
    setDraggedWorkflowNodeId(null);
  };

  const scanImpact = async (text: string) => {
    try {
      setLoadingImpact(true);
      setImpactData(null);
      const response = await api.post("/impact/analyze", { content: text });
      setImpactData(response.data.impact);
    } catch (error) {
      console.error("Failed to compile impact metrics:", error);
    } finally {
      setLoadingImpact(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      setLoading(true);
      await api.post(`/reviews/${reviewId}/approve`);
      await fetchData();
    } catch (error) {
      console.error("Failed to approve draft requirement:", error);
      setLoading(false);
    }
  };

  const handleActionWithComment = async () => {
    if (!commentText.trim() || !selectedReviewId) return;

    try {
      setLoading(true);
      if (showCommentModal === "change") {
        await api.post(`/reviews/${selectedReviewId}/request-change`, { comments: commentText });
      } else {
        await api.post(`/reviews/${selectedReviewId}/refine`, { comments: commentText });
      }
      setShowCommentModal(null);
      setCommentText("");
      await fetchData();
    } catch (error) {
      console.error("PM operation failed:", error);
      setLoading(false);
    }
  };

  const handleDeleteMaster = async (masterId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this approved requirement master entry?")) return;
    try {
      setLoading(true);
      await api.delete(`/requirements-master/${masterId}`);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete master record:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/95 to-[#FF4FA3] bg-clip-text text-transparent">
          👑 Requirement Master & Review Center
        </h1>
        <p className="text-white/60 mt-2 text-md">
          Establish and review authoritative system rules, run systems impact scans, and review AI Functional Specifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl cursor-pointer ${
            activeTab === "approved"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Approved Truth ({approvedList.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl cursor-pointer ${
            activeTab === "reviews"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Draft Reviews Inbox ({reviewsList.length})
        </button>
      </div>

      {loading && (
        <div className="text-center text-white py-12">
          <div className="animate-pulse text-lg">Retrieving requirement records...</div>
        </div>
      )}

      {/* Main Container */}
      {!loading && (
        <div className="flex flex-col gap-8 w-full">
          {/* List panel - now full width grid */}
          <div className="w-full bg-[#12184A] rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4 animate-fadeIn">
            <h2 className="text-lg font-bold text-white mb-2">
              {activeTab === "approved" ? "Approved Spec Catalog" : "Draft Spec Inbox"}
            </h2>

            {activeTab === "approved" && approvedList.length === 0 && (
              <div className="text-white/40 text-xs py-8 text-center">No approved requirement specifications yet. Approve draft items in the reviews inbox.</div>
            )}
            {activeTab === "reviews" && reviewsList.length === 0 && (
              <div className="text-white/40 text-xs py-8 text-center">No pending requirement reviews in the inbox. Analyze initial concepts in the requirements page.</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {activeTab === "approved" &&
                approvedList.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      setSelectedApprovedId(item._id);
                      loadFrd(item._id);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between min-h-[140px] ${
                      selectedApprovedId === item._id
                        ? "bg-[#FF4FA3]/15 border-[#FF4FA3] shadow-md shadow-[#FF4FA3]/5"
                        : "bg-[#0D113D] border-white/5 hover:border-white/20 hover:bg-[#0e1347]"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                          {item.requirementCode}
                        </span>
                        <span className="text-[10px] text-white/40">V{item.version}</span>
                      </div>
                      <h3 className="text-white font-bold text-sm mt-2 line-clamp-2">{item.title}</h3>
                      <p className="text-white/50 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                        {item.refinedRequirement}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end mt-3 border-t border-white/5 pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMaster(item._id);
                          }}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold"
                        >
                          🗑️ Delete Record
                        </button>
                      </div>
                    )}
                  </div>
                ))}

              {activeTab === "reviews" &&
                reviewsList.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      setSelectedReviewId(item._id);
                      setImpactData(null);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between min-h-[140px] ${
                      selectedReviewId === item._id
                        ? "bg-[#FF4FA3]/15 border-[#FF4FA3] shadow-md shadow-[#FF4FA3]/5"
                        : "bg-[#0D113D] border-white/5 hover:border-white/20 hover:bg-[#0e1347]"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                            item.status === "change_requested"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {item.status === "change_requested" ? "Edits Pending" : "Pending Review"}
                        </span>
                        <span className="text-[10px] text-white/40">V{item.version}</span>
                      </div>
                      <h3 className="text-white font-bold text-sm mt-2 line-clamp-3">
                        {item.analysis?.refinedRequirement?.substring(0, 100)}...
                      </h3>
                      {item.userComments && (
                        <div className="mt-2 text-[10px] bg-red-500/5 text-red-300/80 p-2 rounded border border-red-500/10 italic truncate">
                          User comment: "{item.userComments}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Details Inspector Panel - now full width */}
          <div className="w-full bg-[#12184A] rounded-2xl border border-white/10 shadow-2xl p-6 min-h-[500px] animate-fadeIn">
            {activeTab === "approved" && (
              <div className="space-y-6">
                {selectedApprovedId ? (
                  <div>
                    {loadingFrd ? (
                      <div className="text-center text-white/50 text-xs py-12">Building Functional Specifications (FRD)...</div>
                    ) : frdData ? (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                          <div>
                            <h2 className="text-xl font-bold text-white">Functional Specifications (FRD)</h2>
                            <p className="text-[10px] text-white/40 uppercase mt-0.5">Authoritative Solution Document</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                            APPROVED
                          </span>
                        </div>

                        {/* FRD Internal Tabs */}
                        <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto">
                          {[
                            { id: "intro", label: "Overview" },
                            { id: "stories", label: "User Stories" },
                            { id: "rules", label: "Business Rules" },
                            { id: "diagram", label: "Workflow Diagram" },
                            { id: "tasks", label: `Backlog Tasks (${frdTasks.length})` },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setFrdTab(tab.id as any)}
                              className={`px-3 py-1.5 font-bold transition text-xs rounded-lg shrink-0 ${
                                frdTab === tab.id
                                  ? "bg-[#0D113D] text-[#FF4FA3] border border-white/10"
                                  : "text-white/50 hover:text-white"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* FRD Content Display */}
                        <div className="bg-[#0D113D] border border-white/5 rounded-xl p-6 min-h-[300px]">
                          {frdTab === "intro" && (
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-[#FF4FA3]">System Context & Goals</h3>
                              <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                                {frdData.introduction}
                              </p>
                            </div>
                          )}

                          {frdTab === "stories" && (
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-[#FF4FA3]">Scenarios & User Stories</h3>
                              <div className="space-y-3">
                                {frdData.userStories?.map((story: any, idx: number) => (
                                  <div key={idx} className="bg-[#12184A] border border-white/5 rounded-xl p-4 space-y-2">
                                    <div className="font-bold text-xs text-pink-400">Story: {story.title}</div>
                                    <div className="text-[11px] text-white/80 leading-relaxed">
                                      As a <strong className="text-white">{story.actor}</strong>, I want to{" "}
                                      <strong className="text-white">{story.action}</strong> so that{" "}
                                      <strong className="text-white">{story.benefit}</strong>.
                                    </div>
                                    {story.acceptanceCriteria?.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                        <span className="text-[9px] uppercase tracking-wider text-white/40 block">
                                          Acceptance Criteria
                                        </span>
                                        {story.acceptanceCriteria.map((ac: string, acIdx: number) => (
                                          <div key={acIdx} className="text-[10px] text-white/60 flex items-start gap-1">
                                            <span>•</span> <span>{ac}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {frdTab === "rules" && (
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-[#FF4FA3]">System Invariants & Safeguards</h3>
                              <ul className="space-y-2.5">
                                {frdData.businessRules?.map((rule: string, idx: number) => (
                                  <li key={idx} className="text-xs text-white/95 leading-relaxed flex items-start gap-2 border-l-2 border-cyan-500 pl-3">
                                    {rule}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {frdTab === "diagram" && (
                            <div className="space-y-4">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#0D113D]/60 p-3 rounded-xl border border-white/5">
                                <div className="space-y-1">
                                  <h3 className="text-sm font-bold text-[#FF4FA3]">Interactive Architecture & Flow Diagram</h3>
                                  <p className="text-[10px] text-white/40">Color-coded services, databases, user views, and API integrations.</p>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                  {/* Layout Selector */}
                                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mr-1">Layout:</span>
                                  {[
                                    { id: "hierarchical", label: "Hierarchical Flow" },
                                    { id: "horizontal", label: "Horizontal Architecture" },
                                    { id: "vertical", label: "Vertical Pipeline" },
                                  ].map((opt) => (
                                    <button
                                      key={opt.id}
                                      onClick={() => setLayoutDirection(opt.id as any)}
                                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                                        layoutDirection === opt.id
                                          ? "bg-[#FF4FA3]/25 text-[#FF4FA3] border-[#FF4FA3]/40"
                                          : "bg-white/5 text-white/60 border-transparent hover:text-white"
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                  <div className="h-4 w-px bg-white/10 mx-1" />
                                  <button
                                    onClick={() => setShowRawMermaid(!showRawMermaid)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition cursor-pointer"
                                  >
                                    {showRawMermaid ? "Interactive Graph" : "Raw Mermaid"}
                                  </button>
                                </div>
                              </div>

                              {showRawMermaid ? (
                                <pre className="bg-[#070b30] border border-white/5 rounded-xl p-4 text-xs font-mono text-cyan-400 overflow-x-auto leading-relaxed whitespace-pre-wrap select-text">
                                  {frdData.workflowDiagram}
                                </pre>
                              ) : (
                                <div className="bg-[#070b30] border border-white/5 rounded-xl p-2 relative overflow-auto select-none min-h-[400px] max-h-[600px] custom-scrollbar flex justify-start items-start">
                                  <svg
                                    width={svgWidth}
                                    height={svgHeight}
                                    className="overflow-visible select-none"
                                    onPointerMove={handleWorkflowPointerMove}
                                    onPointerUp={handleWorkflowPointerUp}
                                    onPointerLeave={handleWorkflowPointerUp}
                                  >
                                    <defs>
                                      {/* Grid Background Pattern */}
                                      <pattern id="flowGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="1" cy="1" r="1" fill="rgba(255, 255, 255, 0.08)" />
                                      </pattern>

                                      {/* Card Gradient */}
                                      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#141946" />
                                        <stop offset="100%" stopColor="#0a0c24" />
                                      </linearGradient>

                                      {/* Card Shadow */}
                                      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
                                      </filter>

                                      {/* Drag Glow */}
                                      <filter id="dragGlow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                      </filter>

                                      {/* Arrowhead marker */}
                                      <marker
                                        id="modernArrow"
                                        viewBox="0 0 10 10"
                                        refX="6"
                                        refY="5"
                                        markerWidth="5"
                                        markerHeight="5"
                                        orient="auto-start-reverse"
                                      >
                                        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
                                      </marker>
                                    </defs>

                                    {/* Grid Background fill */}
                                    <rect width="100%" height="100%" fill="url(#flowGrid)" />

                                    {/* Draw Flow Curves */}
                                    {workflowEdges.map((edge: any, index: number) => {
                                      const sourcePos = workflowPositions[edge.source];
                                      const targetPos = workflowPositions[edge.target];
                                      if (!sourcePos || !targetPos) return null;

                                      // Find intersection points dynamically to connect cleanly at card edges
                                      const dx = targetPos.x - sourcePos.x;
                                      const dy = targetPos.y - sourcePos.y;
                                      
                                      let x1 = sourcePos.x;
                                      let y1 = sourcePos.y;
                                      let x2 = targetPos.x;
                                      let y2 = targetPos.y;

                                      if (Math.abs(dy) >= Math.abs(dx)) {
                                        if (dy > 0) {
                                          y1 += 27;
                                          y2 -= 27;
                                        } else {
                                          y1 -= 27;
                                          y2 += 27;
                                        }
                                      } else {
                                        if (dx > 0) {
                                          x1 += 90;
                                          x2 -= 90;
                                        } else {
                                          x1 -= 90;
                                          x2 += 90;
                                        }
                                      }

                                      const segDx = x2 - x1;
                                      const segDy = y2 - y1;

                                      // Draw smooth S-curve
                                      let pathD;
                                      if (Math.abs(segDy) > 20 && Math.abs(segDx) > 20) {
                                        const ctrlY = y1 + segDy / 2;
                                        pathD = `M ${x1} ${y1} C ${x1} ${ctrlY}, ${x2} ${ctrlY}, ${x2} ${y2}`;
                                      } else if (Math.abs(segDx) > 20 && Math.abs(segDy) <= 20) {
                                        const ctrlX = x1 + segDx / 2;
                                        pathD = `M ${x1} ${y1} C ${ctrlX} ${y1}, ${ctrlX} ${y2}, ${x2} ${y2}`;
                                      } else {
                                        pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                                      }

                                      return (
                                        <path
                                          key={index}
                                          d={pathD}
                                          fill="none"
                                          stroke="#38BDF8"
                                          strokeWidth="2"
                                          markerEnd="url(#modernArrow)"
                                          className="opacity-70 transition duration-150 hover:opacity-100 hover:stroke-[#FF4FA3]"
                                        />
                                      );
                                    })}

                                    {/* Draw Node Cards */}
                                    {workflowNodes.map((node: any) => {
                                      const pos = workflowPositions[node.id] || { x: 200, y: 100 };
                                      const isDragged = draggedWorkflowNodeId === node.id;
                                      const meta = getNodeType(node.label);
                                      
                                      return (
                                        <g
                                          key={node.id}
                                          onPointerDown={(e) => {
                                            e.stopPropagation();
                                            handleWorkflowPointerDown(node.id);
                                          }}
                                          className="cursor-grab active:cursor-grabbing group"
                                        >
                                          {/* Glow highlight for selected / dragged node */}
                                          {isDragged && (
                                            <rect
                                              x={pos.x - 92}
                                              y={pos.y - 29}
                                              width={184}
                                              height={58}
                                              rx={10}
                                              fill="none"
                                              stroke={meta.color}
                                              strokeWidth={3}
                                              opacity={0.4}
                                              className="blur-xs"
                                            />
                                          )}

                                          {/* Card body */}
                                          <rect
                                            x={pos.x - 90}
                                            y={pos.y - 27}
                                            width={180}
                                            height={54}
                                            rx={8}
                                            fill="url(#cardGrad)"
                                            stroke={isDragged ? meta.color : "rgba(255, 255, 255, 0.12)"}
                                            strokeWidth={isDragged ? 1.5 : 1}
                                            filter="url(#cardShadow)"
                                            className="transition duration-150 group-hover:stroke-white/30"
                                          />

                                          {/* Colored Left Accent Strip */}
                                          <rect
                                            x={pos.x - 90}
                                            y={pos.y - 27}
                                            width={6}
                                            height={54}
                                            rx={2}
                                            fill={meta.color}
                                          />

                                          {/* Icon Badge */}
                                          <text
                                            x={pos.x - 76}
                                            y={pos.y - 8}
                                            fontSize="12"
                                            className="select-none pointer-events-none"
                                          >
                                            {meta.icon}
                                          </text>

                                          {/* Category / Badge Label */}
                                          <text
                                            x={pos.x - 58}
                                            y={pos.y - 9}
                                            fill={meta.color}
                                            fontSize="8"
                                            fontWeight="bold"
                                            className="font-sans tracking-wide uppercase select-none pointer-events-none"
                                          >
                                            {meta.badge}
                                          </text>

                                          {/* Main Node Label (Wrapped/Truncated gracefully) */}
                                          <text
                                            x={pos.x - 76}
                                            y={pos.y + 12}
                                            fill="#FFFFFF"
                                            fontSize="9.5"
                                            fontWeight="600"
                                            className="font-sans select-none pointer-events-none tracking-wide"
                                          >
                                            {node.label && node.label.length > 25 ? `${node.label.substring(0, 23)}...` : node.label}
                                          </text>

                                          {/* Node ID indicator */}
                                          <text
                                            x={pos.x + 76}
                                            y={pos.y - 9}
                                            textAnchor="end"
                                            fill="rgba(255, 255, 255, 0.3)"
                                            fontSize="7"
                                            className="font-mono select-none pointer-events-none"
                                          >
                                            {node.id}
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </svg>
                                </div>
                              )}
                              <div className="text-[10px] text-white/30 italic">
                                Drag nodes to organize the system flowchart. Use toggle button to review raw Mermaid flowchart code.
                              </div>
                            </div>
                          )}

                          {frdTab === "tasks" && (
                            <div className="space-y-4">
                              <div className="bg-[#0D113D]/60 p-4 rounded-xl border border-white/5 space-y-1">
                                <h3 className="text-sm font-bold text-[#FF4FA3]">AI Engineering Task Breakdown</h3>
                                <p className="text-[10px] text-white/40">
                                  These are concrete sprint backlog tasks automatically broken down from the FRD stories and rules to track development.
                                </p>
                              </div>

                              {frdTasks.length === 0 ? (
                                <div className="text-white/40 text-xs py-8 text-center bg-[#070b30] border border-white/5 rounded-xl">
                                  No engineering tasks have been created for this specification. Generate them by approving a review draft.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {frdTasks.map((task: any) => {
                                    let prioColor = "bg-blue-500/15 text-blue-300 border-blue-500/20";
                                    if (task.priority === "critical") prioColor = "bg-red-500/15 text-red-300 border-red-500/20";
                                    else if (task.priority === "high") prioColor = "bg-orange-500/15 text-orange-300 border-orange-500/20";
                                    else if (task.priority === "medium") prioColor = "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";

                                    let statusColor = "bg-slate-500/15 text-slate-300";
                                    if (task.status === "completed") statusColor = "bg-emerald-500/15 text-emerald-300";
                                    else if (task.status === "in_progress") statusColor = "bg-cyan-500/15 text-cyan-300";
                                    else if (task.status === "blocked") statusColor = "bg-red-500/15 text-red-300";

                                    return (
                                      <div
                                        key={task._id}
                                        className="bg-[#070b30] border border-white/5 rounded-xl p-4 flex flex-col justify-between gap-4 animate-fadeIn"
                                      >
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-start gap-2">
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${prioColor}`}>
                                              {task.priority} priority
                                            </span>
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${statusColor}`}>
                                              {task.status.replace("_", " ")}
                                            </span>
                                          </div>
                                          <h4 className="text-white font-bold text-xs leading-relaxed">{task.title}</h4>
                                          <p className="text-white/60 text-[11px] leading-relaxed whitespace-pre-wrap">{task.description}</p>
                                        </div>

                                        <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-white/40">
                                          <span>Est: <strong className="text-white">{task.estimatedHours || 0} hrs</strong></span>
                                          {task.assignedTo && <span>Owner: <strong className="text-cyan-400">{task.assignedTo}</strong></span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-white/40 text-xs text-center py-12">No FRD document found for this master record.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-white/40 text-xs text-center py-12">Select an approved master requirement to review full functional specifications.</div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                {selectedReviewId ? (
                  (() => {
                    const review = reviewsList.find((r) => r._id === selectedReviewId);
                    if (!review) return null;
                    return (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                          <div>
                            <h2 className="text-xl font-bold text-white">Review Draft Specification</h2>
                            <p className="text-[10px] text-white/40 uppercase mt-0.5">PM Control Console</p>
                          </div>
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full font-semibold capitalize">
                            {review.status}
                          </span>
                        </div>

                        {/* Specifications panel */}
                        <div className="bg-[#0D113D] border border-white/5 rounded-xl p-4 space-y-2">
                          <span className="text-[10px] uppercase text-white/40 font-mono tracking-wider">Refined Spec Draft</span>
                          <p className="text-white/95 text-xs leading-relaxed">{review.analysis?.refinedRequirement}</p>
                        </div>

                        {/* Gap and Ambiguities check */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0D113D]/40 border border-white/5 rounded-xl p-4">
                            <span className="text-[10px] uppercase text-red-400 font-bold block mb-2">Ambiguities Found</span>
                            <ul className="text-[10px] text-white/70 list-disc ml-4 space-y-1">
                              {review.analysis?.ambiguities?.map((item, idx) => <li key={idx}>{item}</li>)}
                              {(!review.analysis?.ambiguities || review.analysis.ambiguities.length === 0) && (
                                <span className="text-white/40 italic">None</span>
                              )}
                            </ul>
                          </div>
                          <div className="bg-[#0D113D]/40 border border-white/5 rounded-xl p-4">
                            <span className="text-[10px] uppercase text-orange-400 font-bold block mb-2">Missing Information</span>
                            <ul className="text-[10px] text-white/70 list-disc ml-4 space-y-1">
                              {review.analysis?.missingInformation?.map((item, idx) => <li key={idx}>{item}</li>)}
                              {(!review.analysis?.missingInformation || review.analysis.missingInformation.length === 0) && (
                                <span className="text-white/40 italic">None</span>
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => scanImpact(review.analysis?.refinedRequirement)}
                            disabled={loadingImpact}
                            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-cyan-600/10 transition"
                          >
                            {loadingImpact ? "Scanning Systems..." : "🔍 Scan Systems Impact"}
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleApprove(review._id)}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow-lg shadow-green-600/10 transition"
                              >
                                Approve & Publish
                              </button>
                              <button
                                onClick={() => setShowCommentModal("change")}
                                className="px-4 py-2.5 rounded-xl bg-[#0D113D] border border-white/10 text-white font-bold text-xs cursor-pointer hover:bg-[#12184A] transition"
                              >
                                Request Changes
                              </button>
                              <button
                                onClick={() => setShowCommentModal("refine")}
                                className="px-4 py-2.5 rounded-xl bg-[#0D113D] border border-white/10 text-white font-bold text-xs cursor-pointer hover:bg-[#12184A] transition"
                              >
                                Refine with Comments
                              </button>
                            </>
                          )}
                        </div>

                        {/* Impact analysis viewer */}
                        {impactData && (
                          <div className="bg-[#0D113D] border border-cyan-500/20 rounded-xl p-5 space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <h3 className="text-sm font-bold text-cyan-400">Systems Impact Analysis Scan</h3>
                              <span className="text-[10px] text-pink-400 font-bold uppercase bg-pink-500/10 px-2 py-0.5 rounded">
                                Risk: {impactData.riskLevel}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {impactData.structureImpact?.pages?.length > 0 && (
                                <div className="space-y-1 bg-[#12184A]/30 p-3 rounded-lg border border-white/5">
                                  <strong className="text-white/60">Structure Impact</strong>
                                  <div className="text-[11px] text-white/90">
                                    Pages: {impactData.structureImpact.pages.join(", ")}
                                  </div>
                                </div>
                              )}

                              {impactData.datasetImpact?.newTables?.length > 0 && (
                                <div className="space-y-1 bg-[#12184A]/30 p-3 rounded-lg border border-white/5">
                                  <strong className="text-white/60">Dataset Impact</strong>
                                  <div className="text-[11px] text-white/90">
                                    New entities: {impactData.datasetImpact.newTables.join(", ")}
                                  </div>
                                </div>
                              )}

                              {impactData.businessLogicImpact?.apis?.length > 0 && (
                                <div className="space-y-1 bg-[#12184A]/30 p-3 rounded-lg border border-white/5">
                                  <strong className="text-white/60">API / Endpoints Impact</strong>
                                  <div className="text-[11px] text-white/90">
                                    Routes: {impactData.businessLogicImpact.apis.join(", ")}
                                  </div>
                                </div>
                              )}

                              {impactData.securityImpact?.permissions?.length > 0 && (
                                <div className="space-y-1 bg-[#12184A]/30 p-3 rounded-lg border border-white/5">
                                  <strong className="text-white/60">Security Impact</strong>
                                  <div className="text-[11px] text-white/90">
                                    Roles: {impactData.securityImpact.roles?.join(", ") || "No role changes"}<br />
                                    Rules: {impactData.securityImpact.permissions.join(", ")}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-between text-xs text-white/50">
                              <span>Estimated Effort: <strong className="text-white">{impactData.estimatedHours} hrs</strong></span>
                              <span>Verdict: <strong className="text-cyan-400">{impactData.aiVerdict}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-white/40 text-xs text-center py-12">Select a review draft specification to activate control options.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PM Comments Prompt Dialog Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-[#070926]/80 backdrop-blur-xs flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-2">
              {showCommentModal === "change" ? "Request Spec Changes" : "Refine Specification"}
            </h3>
            <p className="text-white/60 text-xs mb-4">
              {showCommentModal === "change"
                ? "State the adjustments required by the product or compliance team."
                : "Add feedback parameters to guide the requirement analyzer refinement."}
            </p>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              className="w-full bg-[#0D113D] rounded-xl p-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-xs leading-relaxed"
              placeholder="E.g., Require identity checks only for transactions exceeding $1,000..."
            />

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowCommentModal(null);
                  setCommentText("");
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleActionWithComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
              >
                Submit feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
