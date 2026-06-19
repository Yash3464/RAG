import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

interface ChangeItem {
  changeType: "addition" | "modification" | "deletion";
  section: string;
  description: string;
  originalText?: string;
  newText?: string;
}

interface SOWUpdate {
  _id: string;
  sowId: string;
  uploadedBy: string;
  versionNumber: number;
  rawText: string;
  isMerged: boolean;
  changesExtracted: ChangeItem[];
  oldContext?: string;
  newContext?: string;
  createdAt: string;
  updatedAt: string;
}

interface SOW {
  _id: string;
  title: string;
  clientName: string;
  projectName: string;
  mainContext: string;
  fullContext: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// IDE Mock code editor window for readable diff snapshots
const EditorWindow = ({
  title,
  badge,
  content,
  badgeColor,
}: {
  title: string;
  badge: string;
  content: string;
  badgeColor: string;
}) => {
  return (
    <div className="bg-[#0b1033] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[480px]">
      {/* OS Mock Titlebar */}
      <div className="bg-[#070b24] px-4 py-3 flex items-center justify-between border-b border-white/5 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <span className="text-[10px] font-mono text-white/50 tracking-wider font-bold">{title}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider ${badgeColor}`}>
          {badge}
        </span>
      </div>
      
      {/* Code Text Area */}
      <div className="p-4 flex-1 bg-[#050821] overflow-y-auto max-h-[520px] custom-scrollbar select-text">
        <pre className="text-white/80 text-[11px] font-mono leading-relaxed whitespace-pre-wrap select-text">
          {content || "(Empty document context)"}
        </pre>
      </div>
    </div>
  );
};

export default function SOWHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingUpdateId = searchParams.get("pendingUpdateId");

  const [sow, setSow] = useState<SOW | null>(null);
  const [updates, setUpdates] = useState<SOWUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<SOWUpdate | null>(null);
  
  // Tab and comparison states
  const [activeTab, setActiveTab] = useState<"summary" | "full">("summary");
  const [showSnapshotCompare, setShowSnapshotCompare] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [id]);

  useEffect(() => {
    setShowSnapshotCompare(false);
  }, [selectedUpdate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sow/${id}`);
      setSow(response.data.sow);
      const updateList: SOWUpdate[] = response.data.updates || [];
      setUpdates(updateList);

      if (updateList.length > 0) {
        // If query parameters have a pendingUpdateId, auto-select it. Otherwise select the latest update.
        const match = pendingUpdateId ? updateList.find(u => u._id === pendingUpdateId) : null;
        setSelectedUpdate(match || updateList[0]);
      }
    } catch (err) {
      console.error("Failed to load SOW history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMergeUpdate = async (updateId: string) => {
    try {
      setMerging(true);
      await api.post(`/sow/${updateId}/merge`);
      await fetchHistory();
      alert("Successfully merged approved diff updates into Main SOW Context!");
    } catch (err) {
      console.error("Failed to merge SOW update:", err);
      alert("Failed to merge updates. Verify Groq/LLM SDK capacity.");
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return <div className="text-center text-white/50 text-sm py-24">Retrieving SOW history logs...</div>;
  }

  if (!sow) {
    return (
      <div className="text-center text-white/50 text-sm py-24">
        Statement of Work document not found.
        <button onClick={() => navigate("/sow")} className="ml-4 text-cyan-400 font-bold hover:underline">
          Back to Portal
        </button>
      </div>
    );
  }

  // Calculate dynamic context to show on the left panel tab based on the selected version
  const getDisplayedContent = () => {
    if (activeTab === "summary") {
      return sow.mainContext;
    }

    // Full Document Context Tab: dynamically display the state at the selected version
    if (selectedUpdate) {
      if (selectedUpdate.isMerged) {
        // For merged updates, display the post-merge context snapshot
        // If snapshot is empty (legacy), fall back to rawText (which is the V1 context)
        return selectedUpdate.newContext || selectedUpdate.rawText || "";
      } else {
        // For pending/draft updates, display the raw uploaded proposed text
        return selectedUpdate.rawText || "";
      }
    }

    // Default fallback to active SOW full context
    return sow.fullContext || sow.mainContext || "";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header breadcrumbs */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-wider">
            <span onClick={() => navigate("/sow")} className="hover:text-white cursor-pointer transition">
              SOW Portal
            </span>
            <span>&rarr;</span>
            <span className="text-white/60">{sow.clientName} ({sow.title})</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">{sow.projectName}</h1>
        </div>

        <button
          onClick={() => navigate("/sow")}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition cursor-pointer"
        >
          &larr; Back to SOW Portal
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: SOW Main Context (60% width / 7 cols) with Tabs */}
        <div className="lg:col-span-7 bg-[#12184A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          {/* Tabs bar */}
          <div className="flex border-b border-white/10 bg-[#0e133c]">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "summary"
                  ? "border-[#FF4FA3] text-white bg-white/5"
                  : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              📋 Project Summary
            </button>
            <button
              onClick={() => setActiveTab("full")}
              className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === "full"
                  ? "border-[#FF4FA3] text-white bg-white/5"
                  : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              📄 Full Document Context
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Version Metadata Row */}
            <div className="flex justify-between items-center">
              <span className="text-white/50 text-xs font-bold uppercase tracking-wider">
                {activeTab === "summary" 
                  ? "AI Executive Summary View" 
                  : selectedUpdate 
                    ? `Contract Version V${selectedUpdate.versionNumber} - ${selectedUpdate.isMerged ? "Merged state" : "Draft proposal"}` 
                    : "Complete Contract Text View"
                }
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                selectedUpdate
                  ? selectedUpdate.isMerged
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}>
                {selectedUpdate 
                  ? `SELECTED V${selectedUpdate.versionNumber}` 
                  : `ACTIVE VERSION V${sow.currentVersion}`
                }
              </span>
            </div>

            {/* Banner Warnings */}
            {activeTab === "summary" && selectedUpdate && selectedUpdate.versionNumber !== sow.currentVersion && (
              <div className="bg-[#0b1236]/80 border border-cyan-500/20 px-4 py-2.5 rounded-xl text-xs text-cyan-300 animate-fadeIn select-none">
                <span>ℹ️ Showing cumulative active project summary. Select <strong>Full Document Context</strong> to review SOW text at version V{selectedUpdate.versionNumber}.</span>
              </div>
            )}

            {activeTab === "full" && selectedUpdate && !selectedUpdate.isMerged && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 rounded-xl text-xs text-yellow-300 animate-fadeIn select-none">
                <span>⚠️ Reviewing <strong>Proposed Draft V{selectedUpdate.versionNumber}</strong>. These edits are draft changes and are not yet merged into the main context.</span>
              </div>
            )}

            {activeTab === "full" && selectedUpdate && selectedUpdate.isMerged && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-xs text-emerald-300 animate-fadeIn select-none">
                <span>✅ Reviewing <strong>Merged Version V{selectedUpdate.versionNumber}</strong>. This represents the contract state after merging this version's updates.</span>
              </div>
            )}

            {/* Main Text scroll container */}
            <div className="bg-[#0D113D] border border-white/5 rounded-xl p-5 min-h-[500px] max-h-[700px] overflow-y-auto custom-scrollbar select-text animate-fadeIn">
              <pre className="text-white/90 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text pr-2">
                {getDisplayedContent()}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Update Review Panel (40% width / 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Version History Timeline */}
          <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-md font-bold text-white">Version Timeline</h3>

            <div className="relative border-l-2 border-white/10 pl-6 ml-3 space-y-6">
              {updates.map((up) => {
                const isSelected = selectedUpdate?._id === up._id;
                return (
                  <div
                    key={up._id}
                    onClick={() => setSelectedUpdate(up)}
                    className="relative cursor-pointer group"
                  >
                    {/* Timeline bullet indicator */}
                    <div
                      className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 transition ${
                        isSelected
                          ? "bg-[#FF4FA3] border-[#FF4FA3]"
                          : up.isMerged
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-yellow-500 border-yellow-500"
                      }`}
                    />

                    <div
                      className={`p-3 rounded-xl border transition ${
                        isSelected
                          ? "bg-[#FF4FA3]/10 border-[#FF4FA3] shadow-md shadow-[#FF4FA3]/5"
                          : "bg-[#0D113D] border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-white">Version V{up.versionNumber}</span>
                        <span
                          className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                            up.isMerged ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {up.isMerged ? "Merged" : "Pending Merge"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-white/40 mt-1 font-semibold">
                        <span>Uploaded by: {up.uploadedBy}</span>
                        <span>{new Date(up.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Diff Inspector details */}
          {selectedUpdate && (
            <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-white">AI Diff Review (V{selectedUpdate.versionNumber})</h3>
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">
                  {selectedUpdate.changesExtracted.length} Changes
                </span>
              </div>

              {/* Merge Prompt Action Box */}
              {!selectedUpdate.isMerged && (
                <div className="bg-[#0D113D]/50 border border-yellow-500/30 rounded-xl p-4 space-y-3">
                  <div className="text-xs text-white/80 leading-relaxed">
                    This revision version has not been merged into the active context document. Review the extracted edits below and apply them.
                  </div>
                  <button
                    onClick={() => handleMergeUpdate(selectedUpdate._id)}
                    disabled={merging}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-90 disabled:opacity-40 text-white font-bold text-xs cursor-pointer shadow-lg shadow-green-600/10 transition"
                  >
                    {merging ? "Merging Changes..." : "⚡ Approve & Merge Changes"}
                  </button>
                </div>
              )}

              {/* List of changes */}
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedUpdate.changesExtracted.map((change, idx) => {
                  let borderStyle = "border-green-500/30 bg-green-500/5";
                  let badgeText = "ADDITION";
                  let badgeColor = "bg-green-500/20 text-green-300";

                  if (change.changeType === "modification") {
                    borderStyle = "border-yellow-500/30 bg-yellow-500/5";
                    badgeText = "MODIFICATION";
                    badgeColor = "bg-yellow-500/20 text-yellow-300";
                  } else if (change.changeType === "deletion") {
                    borderStyle = "border-red-500/30 bg-red-500/5";
                    badgeText = "DELETION";
                    badgeColor = "bg-red-500/20 text-red-300";
                  }

                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 space-y-2 text-xs leading-relaxed animate-fadeIn ${borderStyle}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <strong className="text-white/80 font-semibold">{change.section || "General"}</strong>
                      </div>

                      <p className="text-white/70 italic mt-1 font-semibold">{change.description}</p>

                      {/* Display original vs new diffs */}
                      {change.changeType === "modification" && (
                        <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-white/5">
                          {change.originalText && (
                            <div className="bg-red-500/10 border border-red-500/15 p-2 rounded-lg text-[10px] text-red-300/95 font-mono select-text max-h-[120px] overflow-y-auto custom-scrollbar">
                              <span className="text-[8px] font-bold uppercase tracking-wider block text-red-400 mb-1">Original Text</span>
                              {change.originalText}
                            </div>
                          )}
                          {change.newText && (
                            <div className="bg-green-500/10 border border-green-500/15 p-2 rounded-lg text-[10px] text-green-300/95 font-mono select-text max-h-[120px] overflow-y-auto custom-scrollbar">
                              <span className="text-[8px] font-bold uppercase tracking-wider block text-green-400 mb-1">New Replacement</span>
                              {change.newText}
                            </div>
                          )}
                        </div>
                      )}

                      {change.changeType === "addition" && change.newText && (
                        <div className="bg-green-500/10 border border-green-500/15 p-2 rounded-lg text-[10px] text-green-300/95 font-mono select-text max-h-[150px] overflow-y-auto custom-scrollbar mt-2">
                          <span className="text-[8px] font-bold uppercase tracking-wider block text-green-400 mb-1">Added Content</span>
                          {change.newText}
                        </div>
                      )}

                      {change.changeType === "deletion" && change.originalText && (
                        <div className="bg-red-500/10 border border-red-500/15 p-2 rounded-lg text-[10px] text-red-300/95 font-mono select-text max-h-[150px] overflow-y-auto custom-scrollbar mt-2">
                          <span className="text-[8px] font-bold uppercase tracking-wider block text-red-400 mb-1">Removed Content</span>
                          {change.originalText}
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedUpdate.changesExtracted.length === 0 && (
                  <div className="text-white/40 text-[11px] italic text-center py-8">
                    No edits were detected. This version is identical to the preceding version.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Comparison Panel (Full Width below Main Context and Timeline) */}
      {selectedUpdate && ((selectedUpdate.isMerged && (selectedUpdate.oldContext || selectedUpdate.newContext)) || !selectedUpdate.isMerged) && (
        <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>📸</span> {selectedUpdate.isMerged ? "MERGED SNAPSHOTS" : "PROPOSED CHANGES CONTEXT"}
              </h4>
              <p className="text-xs text-white/40">
                {selectedUpdate.isMerged 
                  ? "Compare full contract text before and after merging this version."
                  : "Compare current active contract with the proposed draft upload."}
              </p>
            </div>
            <button
              onClick={() => setShowSnapshotCompare(!showSnapshotCompare)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                showSnapshotCompare
                  ? "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                  : "bg-[#FF4FA3]/15 text-[#FF4FA3] hover:bg-[#FF4FA3]/25 border-[#FF4FA3]/30"
              }`}
            >
              {showSnapshotCompare ? "Hide Snapshots" : "Compare Text"}
            </button>
          </div>
          
          {showSnapshotCompare && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn pt-2">
              {/* Left Window: Before/Current */}
              <EditorWindow
                title={selectedUpdate.isMerged ? "Pre-Merge Document State" : "Current Active Contract"}
                badge="Before Merge"
                badgeColor="bg-white/10 text-white/60"
                content={selectedUpdate.isMerged ? (selectedUpdate.oldContext || "(Empty baseline)") : (sow.fullContext || sow.mainContext)}
              />

              {/* Right Window: After/Proposed */}
              <EditorWindow
                title={selectedUpdate.isMerged ? "Post-Merge Document State" : "Proposed Draft Upload"}
                badge={selectedUpdate.isMerged ? "Merged V" + selectedUpdate.versionNumber : "Proposed V" + selectedUpdate.versionNumber}
                badgeColor={selectedUpdate.isMerged ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#FF4FA3]/20 text-[#FF4FA3] border border-[#FF4FA3]/30 animate-pulse"}
                content={selectedUpdate.isMerged ? (selectedUpdate.newContext || "(No context captured)") : selectedUpdate.rawText}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
