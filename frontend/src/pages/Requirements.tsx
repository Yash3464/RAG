import { useState } from "react";
import { api } from "../services/api";

export default function Requirements() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Recommendations state
  const [showRecsPrompt, setShowRecsPrompt] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recs, setRecs] = useState<any>(null);
  const [activeRecTab, setActiveRecTab] = useState<string>("assumptions");

  // Knowledge Graph state
  const [graphData, setGraphData] = useState<any>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Chat copilot state
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loadingChat) return;

    const userMsg = { role: "user" as const, content: chatInput };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setLoadingChat(true);

    try {
      const response = await api.post("/requirements/chat", {
        messages: updatedHistory,
        requirement: content,
      });
      setChatHistory([
        ...updatedHistory,
        { role: "assistant" as const, content: response.data.reply }
      ]);
    } catch (error) {
      console.error(error);
      setChatHistory([
        ...updatedHistory,
        { role: "assistant" as const, content: "Sorry, I encountered an error compiling that request." }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const analyzeRequirement = async () => {
    try {
      setLoading(true);
      setRecs(null);
      setGraphData(null);
      setSelectedNode(null);
      setShowRecsPrompt(false);

      const response = await api.post("/requirements/analyze", {
        content,
      });

      setResult(response.data);
      setShowRecsPrompt(true);

      // Fetch Knowledge Graph
      if (response.data.journalId) {
        fetchGraph(response.data.journalId);
      }
    } catch (error: any) {
      console.error(error);
      setResult({
        error: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGraph = async (nodeId: string) => {
    try {
      setLoadingGraph(true);
      const response = await api.get(`/graph/${nodeId}`);
      setGraphData(response.data.graph);
      
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

  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const response = await api.post("/requirements/recommendations", {
        content,
      });
      setRecs(response.data.recommendations);
      setShowRecsPrompt(false);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Helper to compute node positions dynamically in radial/star pattern
  const computeNodePositions = (nodes: any[], centralId: string) => {
    const radius = 220; // Expanded radius
    const centerX = 400; // Shifted center X to middle of 800px canvas
    const centerY = 250; // Shifted center Y to middle of 500px canvas
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

  const handlePointerDown = (nodeId: string) => {
    setDraggedNodeId(nodeId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedNodeId) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 500;
    const boundedX = Math.max(60, Math.min(740, x));
    const boundedY = Math.max(40, Math.min(460, y));

    setNodePositions((prev) => ({
      ...prev,
      [draggedNodeId]: { x: boundedX, y: boundedY },
    }));
  };

  const handlePointerUp = () => {
    setDraggedNodeId(null);
  };

  const injectRecommendation = (text: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n[AI Suggestion Injected]: ${text}` : `[AI Suggestion Injected]: ${text}`;
    });
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A39D8]/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-bold mb-4">Requirement Entry</h2>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full bg-[#0D113D] rounded-xl p-4 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none placeholder-white/30 text-sm leading-relaxed"
              placeholder="Example: Users must be verified using Stripe KYC before they can withdraw funds from their wallet, and withdrawals over $10k must require compliance officer approval."
            />

            <button
              onClick={analyzeRequirement}
              disabled={loading || !content.trim()}
              className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-[#7A39D8] via-[#B637BF] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold tracking-wide transition shadow-lg cursor-pointer"
            >
              {loading ? "Analyzing Requirement..." : "Analyze Requirement"}
            </button>
          </div>
        </div>

        {/* Right Column: AI Analysis details */}
        <div className="xl:col-span-8 space-y-6">
          {!result && (
            <div className="bg-[#12184A] p-12 rounded-2xl border border-white/10 text-center text-white/50 shadow-2xl">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-2">AI Product Intelligence</h3>
              <p className="max-w-md mx-auto">
                Enter a requirement or ticket to run semantic deduplication, priority scoring, effort estimates, knowledge graph builds, and cross-functional recommendation engines.
              </p>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 shadow-md">
              <div className="text-red-400 font-bold text-lg mb-2">Analysis Failed</div>
              <p className="text-white/80">{result.error}</p>
            </div>
          )}

          {result?.duplicate && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-yellow-400 font-bold text-xl flex items-center gap-2">
                  <span>⚠️</span> Duplicate Entry Detected
                </h3>
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-semibold uppercase">
                  Existing Knowledge Node
                </span>
              </div>
              <div>
                <p className="text-white/60 text-xs">Duplicate content matched against project memory:</p>
                <p className="mt-2 text-white italic bg-[#0D113D]/40 p-4 rounded-xl border border-white/5 text-sm leading-relaxed">
                  "{result.existing?.content}"
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#12184A] p-3 rounded-xl">
                  <span className="text-white/40 text-xs uppercase font-semibold">Classification</span>
                  <div className="font-bold text-white mt-1 capitalize">{result.existing?.classification}</div>
                </div>
                <div className="bg-[#12184A] p-3 rounded-xl">
                  <span className="text-white/40 text-xs uppercase font-semibold">Priority</span>
                  <div className="font-bold text-white mt-1 capitalize">{result.existing?.priority}</div>
                </div>
              </div>
            </div>
          )}

          {result && !result.duplicate && !result.error && (
            <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-[#FF4FA3]">AI Analysis Summary</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                  <div className="text-white/40 text-[10px] uppercase font-semibold">Classification</div>
                  <div className="font-bold text-white text-md mt-1 capitalize">{result.classification}</div>
                </div>
                <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                  <div className="text-white/40 text-[10px] uppercase font-semibold">Priority Score</div>
                  <div className="font-bold text-white text-md mt-1">
                    {result.priorityScore} <span className="text-xs text-white/50 font-normal">({result.priority})</span>
                  </div>
                </div>
                <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                  <div className="text-white/40 text-[10px] uppercase font-semibold">Complexity</div>
                  <div className="font-bold text-cyan-400 text-md mt-1">{result.effort?.complexity || 1}/5</div>
                </div>
                <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                  <div className="text-white/40 text-[10px] uppercase font-semibold">Est. Refactor</div>
                  <div className="font-bold text-pink-400 text-md mt-1">
                    {(result.effort?.development || 0) + (result.effort?.testing || 0)} hrs
                  </div>
                </div>
              </div>
              {result.analysis?.refinedRequirement && (
                <div className="mt-6 bg-[#0D113D]/40 p-4 rounded-xl border border-white/5">
                  <div className="text-white/50 text-xs font-semibold mb-2">Refined Requirement Statement</div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    {result.analysis.refinedRequirement}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-width sections below the Entry & Summary Row */}
      {result && !result.duplicate && !result.error && (
        <div className="space-y-8 animate-fadeIn">
          {/* Knowledge Graph & Node Inspector (now full width) */}
          {graphData && (
            <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="text-xl font-bold mb-1">Knowledge Graph Context Map</h3>
              <p className="text-white/50 text-xs mb-4">Drag nodes to position, click to select. All relationships adapt dynamically.</p>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Interactive SVG Diagram */}
                <div className="lg:col-span-3 bg-[#0D113D] border border-white/5 rounded-xl p-4 flex justify-center items-center relative overflow-auto h-[500px]">
                    {loadingGraph ? (
                      <div className="flex items-center justify-center text-white/50 text-xs h-full">Loading Graph...</div>
                    ) : (
                      <svg
                        width="800"
                        height="500"
                        className="overflow-visible select-none"
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                      >
                        <defs>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Draw Edges */}
                        {graphData.edges.map((edge: any, index: number) => {
                          const sourceNode = graphData.nodes.find((n: any) => n.nodeId === edge.sourceNodeId);
                          const targetNode = graphData.nodes.find((n: any) => n.nodeId === edge.targetNodeId);
                          if (!sourceNode || !targetNode) return null;
                          const sourcePos = getNodePos(sourceNode, graphData.centralNode.nodeId);
                          const targetPos = getNodePos(targetNode, graphData.centralNode.nodeId);

                          return (
                            <g key={index}>
                              <line
                                x1={sourcePos.x}
                                y1={sourcePos.y}
                                x2={targetPos.x}
                                y2={targetPos.y}
                                stroke={getEdgeColor(edge.relationshipType)}
                                strokeWidth="2"
                                strokeDasharray={edge.relationshipType === "depends_on" ? "4 4" : "0"}
                                className="opacity-60"
                              />
                              {/* Edge Label at midpoint */}
                              <rect
                                x={(sourcePos.x + targetPos.x) / 2 - 25}
                                y={(sourcePos.y + targetPos.y) / 2 - 7}
                                width="50"
                                height="14"
                                rx="3"
                                fill="#0D113D"
                                stroke={getEdgeColor(edge.relationshipType)}
                                strokeWidth="1"
                                className="opacity-90"
                              />
                              <text
                                x={(sourcePos.x + targetPos.x) / 2}
                                y={(sourcePos.y + targetPos.y) / 2 + 3}
                                textAnchor="middle"
                                fill="#A1A1AA"
                                fontSize="7"
                                className="font-bold font-mono"
                              >
                                {edge.relationshipType}
                              </text>
                            </g>
                          );
                        })}

                        {/* Draw Nodes */}
                        {graphData.nodes.map((node: any) => {
                          const isCentral = node.nodeId === graphData.centralNode.nodeId;
                          const pos = getNodePos(node, graphData.centralNode.nodeId);
                          return (
                            <g
                              key={node.nodeId}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                handlePointerDown(node.nodeId);
                                setSelectedNode(node);
                              }}
                              className="cursor-grab active:cursor-grabbing group"
                            >
                              <rect
                                x={pos.x - 70}
                                y={pos.y - 18}
                                width={140}
                                height={36}
                                rx={8}
                                fill={getNodeColor(node.nodeType, isCentral)}
                                stroke={selectedNode?.nodeId === node.nodeId ? "#FFFFFF" : "rgba(255, 255, 255, 0.15)"}
                                strokeWidth={selectedNode?.nodeId === node.nodeId ? 2 : 1}
                                className="transition duration-150 group-hover:brightness-110"
                                filter={isCentral ? "url(#glow)" : ""}
                              />
                              <text
                                x={pos.x}
                                y={pos.y + 4}
                                textAnchor="middle"
                                fill="#FFFFFF"
                                fontSize="9"
                                className="font-bold select-none pointer-events-none tracking-wide"
                              >
                                {node.title && node.title.length > 25 ? `${node.title.substring(0, 23)}...` : node.title}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>

                  {/* Selected Node Content Drawer */}
                  <div className="bg-[#0D113D] border border-white/5 rounded-xl p-6 h-[500px] flex flex-col justify-between overflow-y-auto">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>🔍</span> Node Inspector
                      </h3>
                      {selectedNode ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white capitalize shadow-md"
                              style={{ backgroundColor: getNodeColor(selectedNode.nodeType, selectedNode.isCentral) }}
                            >
                              {selectedNode.nodeType}
                            </span>
                            {selectedNode.priority && (
                              <span className="text-xs text-white/50 capitalize font-semibold bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                Priority: {selectedNode.priority}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-white text-md leading-snug">{selectedNode.title}</h4>
                          <p className="text-white/70 text-sm leading-relaxed max-h-[160px] overflow-y-auto pr-1">
                            {selectedNode.content}
                          </p>
                        </div>
                      ) : (
                        <div className="text-white/40 text-xs text-center py-8">
                          Click and drag nodes in the context map, or click any node to review detailed architecture rules here.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendation Engine Tab Button Prompt */}
            {showRecsPrompt && (
              <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg text-center space-y-4">
                <h3 className="text-lg font-bold">Challenge & Refine Requirement</h3>
                <p className="text-white/60 text-xs leading-relaxed max-w-md mx-auto">
                  Engage our cross-functional AI product panel to detect compliance gaps, scalability limits, security concerns, and blind spots.
                </p>
                <button
                  onClick={fetchRecommendations}
                  disabled={loadingRecs}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold transition cursor-pointer text-xs"
                >
                  {loadingRecs ? "Generating Recommendations..." : "Generate AI recommendations"}
                </button>
              </div>
            )}

            {/* Full Width AI Recommendation Panel */}
            {recs && (
              <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg animate-fadeIn">
                <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-1.5">
                  <span>💡</span> AI Recommendations Panel
                </h3>
                <p className="text-white/40 text-[10px] mb-5">Click Inject button to copy suggestions directly into the Spec editor.</p>

                {/* Rec tabs */}
                <div className="flex border-b border-white/10 gap-1.5 mb-5 overflow-x-auto pb-1">
                  {[
                    { id: "assumptions", label: "PM Assumptions" },
                    { id: "blindSpots", label: "Architect Gaps" },
                    { id: "edgeCases", label: "QA Edge Cases" },
                    { id: "security", label: "Security" },
                    { id: "compliance", label: "Compliance" },
                    { id: "scalability", label: "Scalability" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveRecTab(tab.id)}
                      className={`px-3 py-1.5 font-bold transition text-[10px] rounded-t-lg shrink-0 ${
                        activeRecTab === tab.id
                          ? "bg-[#0D113D] border-t border-x border-white/10 text-[#FF4FA3]"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Rec Content Grid - 2 columns for maximum details and no scrollbars */}
                <div className="bg-[#0D113D] rounded-xl p-6 border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeRecTab === "assumptions" && recs.assumptions?.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-pink-500 pl-4 py-1 flex justify-between items-start gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white">Assumption: {item.assumption}</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">Challenge: {item.challenge}</div>
                        </div>
                        <button
                          onClick={() => injectRecommendation(`Assumption: ${item.assumption}. Challenge: ${item.challenge}`)}
                          className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-bold text-[10px] border border-pink-500/20 shrink-0 transition"
                          title="Inject into spec editor"
                        >
                          ➕ Inject
                        </button>
                      </div>
                    ))}

                    {activeRecTab === "blindSpots" && recs.blindSpots?.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-purple-500 pl-4 py-1 flex justify-between items-start gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white">Blind Spot: {item.spot}</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">Solution: {item.solution}</div>
                        </div>
                        <button
                          onClick={() => injectRecommendation(`Architect Gap: ${item.spot}. Solution: ${item.solution}`)}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold text-[10px] border border-purple-500/20 shrink-0 transition"
                          title="Inject into spec editor"
                        >
                          ➕ Inject
                        </button>
                      </div>
                    ))}

                    {activeRecTab === "edgeCases" && recs.edgeCases?.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-yellow-500 pl-4 py-1 flex justify-between items-start gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white">Edge Case: {item.case}</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">Handling: {item.handling}</div>
                        </div>
                        <button
                          onClick={() => injectRecommendation(`QA Edge Case: ${item.case}. Handling: ${item.handling}`)}
                          className="px-2.5 py-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold text-[10px] border border-yellow-500/20 shrink-0 transition"
                          title="Inject into spec editor"
                        >
                          ➕ Inject
                        </button>
                      </div>
                    ))}

                    {activeRecTab === "security" && recs.security?.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-red-500 pl-4 py-1 flex justify-between items-start gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white">Security Concern: {item.concern}</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">Mitigation: {item.mitigation}</div>
                        </div>
                        <button
                          onClick={() => injectRecommendation(`Security Mitigation: ${item.mitigation}`)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/20 shrink-0 transition"
                          title="Inject into spec editor"
                        >
                          ➕ Inject
                        </button>
                      </div>
                    ))}

                    {activeRecTab === "compliance" && recs.compliance?.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-4 py-1 flex justify-between items-start gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white">Rule: {item.rule}</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">Action Required: {item.action}</div>
                        </div>
                        <button
                          onClick={() => injectRecommendation(`Compliance Action: ${item.action}`)}
                          className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-[10px] border border-blue-500/20 shrink-0 transition"
                          title="Inject into spec editor"
                        >
                          ➕ Inject
                        </button>
                      </div>
                    ))}

                    {activeRecTab === "scalability" && recs.scalability?.map((item: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-green-500 pl-4 py-1 flex justify-between items-start gap-4 animate-fadeIn">
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white">Scalability Bottleneck: {item.bottleneck}</div>
                          <div className="text-[11px] text-white/70 leading-relaxed">Solution: {item.solution}</div>
                        </div>
                        <button
                          onClick={() => injectRecommendation(`Scalability Optimization: ${item.solution}`)}
                          className="px-2.5 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-[10px] border border-green-500/20 shrink-0 transition"
                          title="Inject into spec editor"
                        >
                          ➕ Inject
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Floating Chat Copilot Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-[#7A39D8] to-[#E238A7] hover:scale-110 active:scale-95 text-white font-bold text-xl shadow-2xl flex items-center justify-center transition-all duration-300 z-[9999] cursor-pointer"
        title="Chat with AI Copilot"
      >
        {showChat ? "✖️" : "💬"}
      </button>

      {/* Slide-out Chat Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-[75vw] bg-[#070B42] border-l border-white/10 shadow-2xl z-[9998] flex flex-col justify-between p-6 transition-all duration-300 transform ${
          showChat ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🧠</span> AI Requirements Copilot
            </h3>
            <p className="text-white/40 text-[9px] uppercase font-mono mt-0.5 tracking-wider">Project Memory Advisor</p>
          </div>
          <button
            onClick={() => setShowChat(false)}
            className="text-white/40 hover:text-white text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Content Workspace Split Panel */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 my-4 overflow-hidden h-[calc(100vh-140px)]">
          
          {/* Left Panel: Preview of sent requirement & AI recommendations/data */}
          <div className="flex-[4] flex flex-col gap-4 overflow-y-auto pr-2 border-b md:border-b-0 md:border-r border-white/5 custom-scrollbar">
            
            {/* Requirement Preview Card */}
            <div className="bg-[#0D113D] border border-white/5 rounded-xl p-4 space-y-2">
              <h4 className="text-[10px] uppercase text-[#FF4FA3] font-bold font-mono tracking-wider">Requirement Text Preview</h4>
              <div className="bg-[#070b30]/80 p-3 rounded-lg border border-white/5 max-h-[180px] overflow-y-auto text-xs text-white/95 leading-relaxed whitespace-pre-wrap select-text custom-scrollbar">
                {content || <span className="text-white/30 italic">No requirement text entered in editor.</span>}
              </div>
            </div>

            {/* AI Data Received Card */}
            <div className="bg-[#0D113D] border border-white/5 rounded-xl p-4 space-y-3 flex-1 flex flex-col overflow-hidden">
              <h4 className="text-[10px] uppercase text-cyan-400 font-bold font-mono tracking-wider">Automated Analysis & Gaps</h4>
              <div className="overflow-y-auto pr-1 flex-1 space-y-3 custom-scrollbar text-xs">
                {recs ? (
                  <div className="space-y-3">
                    {recs.blindSpots?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 font-mono block">⚠️ Blind Spots</span>
                        <ul className="list-disc ml-4 text-[11px] text-white/70 space-y-1">
                          {recs.blindSpots.map((item: any, idx: number) => (
                            <li key={idx}><strong className="text-white">{item.spot}</strong>: {item.solution}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recs.edgeCases?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-yellow-400 font-mono block">⚙️ QA Edge Cases</span>
                        <ul className="list-disc ml-4 text-[11px] text-white/70 space-y-1">
                          {recs.edgeCases.map((item: any, idx: number) => (
                            <li key={idx}><strong className="text-white">{item.case}</strong>: {item.handling}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recs.security?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-red-400 font-mono block">🛡️ Security Mitigations</span>
                        <ul className="list-disc ml-4 text-[11px] text-white/70 space-y-1">
                          {recs.security.map((item: any, idx: number) => (
                            <li key={idx}><strong className="text-white">{item.concern}</strong> &rarr; {item.mitigation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-white/30 italic text-center py-12">
                    Submit a requirement for analysis to view compliance, QA cases, and scaling details side-by-side.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Chat Copilot Thread */}
          <div className="flex-[6] flex flex-col justify-between overflow-hidden h-full">
            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-4 animate-fadeIn">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/30 text-xs px-6 py-12">
                  <span className="text-3xl mb-3">🧠</span>
                  <p className="font-bold text-white/80">Refine Your Requirement with AI</p>
                  <p className="mt-1 opacity-70 leading-relaxed">
                    Type questions like "What compliance edge cases should I handle?" or "How can I rewrite this to be clearer?"
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-[#FF4FA3]/25 border border-[#FF4FA3]/40 text-white rounded-br-none"
                          : "bg-[#12184A] border border-white/5 text-white/90 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-[#12184A] border border-white/5 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs text-white/50 animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2 pt-3 border-t border-white/5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0D113D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4FA3]/50 placeholder-white/20"
              />
              <button
                type="submit"
                disabled={loadingChat || !chatInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
