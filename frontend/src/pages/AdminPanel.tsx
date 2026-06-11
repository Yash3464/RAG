import { useEffect, useState } from "react";
import { api } from "../services/api";

interface AuditLog {
  _id: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  targetId: string;
  targetType: string;
  details: string;
  performedBy: string;
  createdAt: string;
}

interface EmployeeStatus {
  _id: string;
  email: string;
  status: "active" | "afk" | "inactive";
  isWorking: boolean;
  currentTask: string;
  secondsElapsed: number;
  lastUpdated: string;
}

interface EmployeeIssue {
  _id: string;
  employeeEmail: string;
  type: "bug" | "issue";
  content: string;
  analysis: {
    rootCause?: string;
    severity?: string;
    fixPlan?: string[];
    testCases?: string[];
    estimatedHours?: number;
    businessImpact?: string;
    recommendations?: string[];
    priority?: string;
  };
  createdAt: string;
}

interface Document {
  _id: string;
  title: string;
  sourceType: "pdf" | "email" | "meeting";
  status: string;
  createdAt: string;
  matchingSnippet?: string; // added on search matches
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<"audit" | "employees" | "documents">("audit");
  
  // Audits & Stats state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [employeeIssues, setEmployeeIssues] = useState<EmployeeIssue[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  
  // Employees tracking state
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  
  // Document expansion cache
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [expandedDocContent, setExpandedDocContent] = useState<{ summary: string; fullText: string } | null>(null);
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteComment, setDeleteComment] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleOpenDeleteModal = (id: string, title: string) => {
    setDocToDelete({ id, title });
    setDeleteComment("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete || !deleteComment.trim() || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/documents/${docToDelete.id}`, {
        data: { comment: deleteComment }
      });
      // Reload documents
      const response = await api.get("/admin/documents");
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
      setDeleteModalOpen(false);
      setDocToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete source:", err);
      alert(err.response?.data?.message || "Failed to delete source.");
    } finally {
      setDeleting(false);
    }
  };

  // Load audit data on mount
  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditData();
    }
  }, [activeTab]);

  // Handle employee statuses real-time polling (every 5 seconds)
  useEffect(() => {
    if (activeTab === "employees") {
      fetchEmployeeStatuses();
      const interval = setInterval(fetchEmployeeStatuses, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Load documents on tab open
  useEffect(() => {
    if (activeTab === "documents") {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchAuditData = async () => {
    try {
      setLoadingAudit(true);
      setError(null);
      
      const [logsRes, issuesRes] = await Promise.all([
        api.get("/audit-logs"),
        api.get("/admin/employee-issues")
      ]);
      
      if (logsRes.data.success) {
        setLogs(logsRes.data.logs);
      }
      if (issuesRes.data.success) {
        setEmployeeIssues(issuesRes.data.issues);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Access denied. Admin privileges required.");
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchEmployeeStatuses = async () => {
    try {
      setError(null);
      const response = await api.get("/admin/employees/status");
      if (response.data.success) {
        setEmployeeStatuses(response.data.statuses);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load employee statuses.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setError(null);
      const response = await api.get("/admin/documents");
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchDocuments(query);
  };

  const searchDocuments = async (q: string) => {
    if (!q.trim()) {
      fetchDocuments();
      return;
    }
    try {
      setSearching(true);
      const response = await api.get(`/admin/documents/search?q=${encodeURIComponent(q)}`);
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (err) {
      console.error("Failed to search documents:", err);
    } finally {
      setSearching(false);
    }
  };

  const toggleExpandDocument = async (id: string) => {
    if (expandedDocId === id) {
      setExpandedDocId(null);
      setExpandedDocContent(null);
      return;
    }

    setExpandedDocId(id);
    setExpandedDocContent(null);
    setLoadingSummaryId(id);

    try {
      const response = await api.get(`/admin/documents/${id}/summary`);
      if (response.data.success) {
        setExpandedDocContent({
          summary: response.data.summary,
          fullText: response.data.fullText
        });
      }
    } catch (err) {
      console.error("Failed to load document summary:", err);
    } finally {
      setLoadingSummaryId(null);
    }
  };

  const formatSeconds = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "UPDATE": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "DELETE": return "bg-red-500/20 text-red-300 border-red-500/30";
      default: return "bg-white/10 text-white/75 border-white/10";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "afk": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "inactive": return "text-slate-400 bg-slate-500/10 border-slate-500/30";
      default: return "text-white/50 bg-white/5 border-white/10";
    }
  };

  const totalCreates = logs.filter((l) => l.action === "CREATE").length;
  const totalUpdates = logs.filter((l) => l.action === "UPDATE").length;
  const totalDeletes = logs.filter((l) => l.action === "DELETE").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-white/95 to-[#FF4FA3] bg-clip-text text-transparent">
          Admin Operations Center
        </h1>
        <p className="text-white/60 mt-2 text-lg">
          Monitor real-time employee sessions, search vectors summary, and review immutable audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => { setActiveTab("audit"); setError(null); }}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl cursor-pointer ${
            activeTab === "audit"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          📜 Control & Audit Log
        </button>
        <button
          onClick={() => { setActiveTab("employees"); setError(null); }}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl cursor-pointer ${
            activeTab === "employees"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          🟢 Real-time Employee Tracker
        </button>
        <button
          onClick={() => { setActiveTab("documents"); setError(null); }}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl cursor-pointer ${
            activeTab === "documents"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          📂 Sources Repository & Search
        </button>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 shadow-2xl">
          <div className="text-4xl">🚫</div>
          <h3 className="text-xl font-bold text-white">Access Restriction</h3>
          <p className="text-sm text-white/60 leading-relaxed">{error}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: AUDIT LOGS AND STATISTICS */}
          {activeTab === "audit" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Operations Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#12184A] rounded-xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl pointer-events-none" />
                  <div className="text-white/50 text-xs font-semibold">Total Documented Operations</div>
                  <div className="text-3xl font-bold mt-2 text-white">{logs.length}</div>
                </div>

                <div className="bg-[#12184A] rounded-xl p-5 border border-emerald-500/10 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="text-emerald-400/80 text-xs font-semibold">Requirement Additions</div>
                  <div className="text-3xl font-bold mt-2 text-emerald-400">{totalCreates}</div>
                </div>

                <div className="bg-[#12184A] rounded-xl p-5 border border-yellow-500/10 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="text-yellow-400/80 text-xs font-semibold">Modifications & Edits</div>
                  <div className="text-3xl font-bold mt-2 text-yellow-400">{totalUpdates}</div>
                </div>

                <div className="bg-[#12184A] rounded-xl p-5 border border-red-500/10 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
                  <div className="text-red-400/80 text-xs font-semibold">Requirement Deletions</div>
                  <div className="text-3xl font-bold mt-2 text-red-400">{totalDeletes}</div>
                </div>
              </div>

              {/* Audit Logs Table Panel */}
              <div className="bg-[#12184A] rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A39D8]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>📜</span> Permanent Audit Trail / Documentation Log
                    </h2>
                    <p className="text-white/40 text-xs mt-1">
                      immutable log feed tracking requirements additions, modifications, and removals.
                    </p>
                  </div>
                  <button
                    onClick={fetchAuditData}
                    disabled={loadingAudit}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition cursor-pointer"
                  >
                    {loadingAudit ? "Refreshing..." : "🔄 Refresh"}
                  </button>
                </div>

                {loadingAudit && logs.length === 0 ? (
                  <div className="text-white flex justify-center items-center py-20 font-semibold">
                    <span className="animate-pulse">Loading system log feed...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-20 text-white/30 text-sm italic">
                    📁 No documented system activities found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] text-white/50 uppercase tracking-widest font-mono">
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Target Type</th>
                          <th className="py-3 px-4">Details</th>
                          <th className="py-3 px-4">Performed By</th>
                          <th className="py-3 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-white/90">
                        {logs.map((log) => (
                          <tr key={log._id} className="hover:bg-[#151c57]/50 transition duration-150">
                            <td className="py-3 px-4 font-semibold">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getActionBadgeColor(log.action)}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 capitalize font-mono text-white/60">
                              {log.targetType.replace("_", " ")}
                            </td>
                            <td className="py-3 px-4 max-w-md truncate font-medium text-white/80" title={log.details}>
                              {log.details}
                            </td>
                            <td className="py-3 px-4 text-cyan-300 font-semibold font-mono">
                              {log.performedBy}
                            </td>
                            <td className="py-3 px-4 text-white/50 font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Employee Bugs & Issues Tracker Log Table */}
              <div className="bg-[#12184A] rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>🐞</span> Employee Bugs & Issues Tracker
                  </h2>
                  <p className="text-white/40 text-xs mt-1">
                    Persistent log of system issues and bugs analyzed by employees in the resolution centers.
                  </p>
                </div>

                {loadingAudit && employeeIssues.length === 0 ? (
                  <div className="text-white flex justify-center items-center py-12 font-semibold">
                    <span className="animate-pulse">Loading employee issues log...</span>
                  </div>
                ) : employeeIssues.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-sm italic">
                    ✅ No logged bugs or issues in the logs.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] text-white/50 uppercase tracking-widest font-mono">
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Logged Content</th>
                          <th className="py-3 px-4">AI Analysis Snippet</th>
                          <th className="py-3 px-4">Priority/Severity</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs text-white/90">
                        {employeeIssues.map((issue) => {
                          const severity = issue.analysis?.severity || issue.analysis?.priority || "medium";
                          return (
                            <tr key={issue._id} className="hover:bg-[#151c57]/50 transition duration-150">
                              <td className="py-3 px-4 text-cyan-300 font-semibold font-mono">
                                {issue.employeeEmail}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                  issue.type === "bug" ? "bg-red-500/20 text-red-300" : "bg-purple-500/20 text-purple-300"
                                }`}>
                                  {issue.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate font-medium text-white/80" title={issue.content}>
                                {issue.content}
                              </td>
                              <td className="py-3 px-4 max-w-sm truncate text-white/60 italic">
                                {issue.analysis?.rootCause || "N/A"}
                              </td>
                              <td className="py-3 px-4 capitalize">
                                <span className={`font-bold ${
                                  severity === "critical" || severity === "high" ? "text-red-400" : (severity === "medium" ? "text-yellow-400" : "text-slate-400")
                                }`}>
                                  {severity}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white/50 font-mono">
                                {new Date(issue.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REAL-TIME EMPLOYEE SESSION TRACKER */}
          {activeTab === "employees" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center bg-[#12184A] p-6 rounded-2xl border border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>👥</span> Active Employee Work Portal Tracker
                  </h2>
                  <p className="text-white/40 text-xs mt-1">
                    Updates automatically every 5 seconds. Displays active timers, task details, and status.
                  </p>
                </div>
                <button
                  onClick={fetchEmployeeStatuses}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition cursor-pointer"
                >
                  🔄 Refresh Now
                </button>
              </div>

              {loadingEmployees && employeeStatuses.length === 0 ? (
                <div className="text-white flex justify-center items-center py-20 font-semibold">
                  <span className="animate-pulse">Loading employee statuses...</span>
                </div>
              ) : employeeStatuses.length === 0 ? (
                <div className="bg-[#12184A] border border-white/5 p-12 text-center text-white/50 rounded-2xl">
                  No employee status logs registered. Active employee portals will register here when loaded.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employeeStatuses.map((status) => {
                    const initials = status.email.substring(0, 2).toUpperCase();
                    return (
                      <div
                        key={status._id}
                        className="bg-[#12184A] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between min-h-[200px]"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Avatar & status badge */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7A39D8] to-[#E238A7] flex items-center justify-center font-black text-white shadow-lg">
                              {initials}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white max-w-[150px] truncate" title={status.email}>
                                {status.email}
                              </div>
                              <span className="text-[9px] text-white/40 uppercase font-bold font-mono">Employee</span>
                            </div>
                          </div>

                          <div className="relative">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize flex items-center gap-1.5 ${getStatusBadgeColor(status.status)}`}>
                              {status.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                              {status.status === "afk" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                              {status.status}
                            </span>
                          </div>
                        </div>

                        {/* Session details */}
                        <div className="my-6 space-y-3">
                          {status.isWorking ? (
                            <>
                              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Currently Working On</div>
                              <p className="text-xs text-white/95 font-medium leading-relaxed line-clamp-3 bg-[#0D113D]/40 p-3 rounded-lg border border-white/5">
                                "{status.currentTask}"
                              </p>
                            </>
                          ) : (
                            <div className="text-center py-4 text-xs text-white/35 italic">
                              Offline / Idle (No session started)
                            </div>
                          )}
                        </div>

                        {/* Active time counter */}
                        {status.isWorking && (
                          <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-mono font-bold text-white/50">
                            <span>SESSION DURATION:</span>
                            <span className="text-[#FF4FA3] text-sm font-semibold">{formatSeconds(status.secondsElapsed)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATA SOURCES REPOSITORY SUMMARY & SEARCH */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Search box & Summary title */}
              <div className="bg-[#12184A] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📂</span> Knowledge Base Repository
                  </h2>
                  <p className="text-white/40 text-xs mt-1">
                    Retrieve ingested document vector assets, inspect their full texts, and run content-wide query searches.
                  </p>
                </div>

                <div className="relative w-full md:w-96">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search inside parsed files..."
                    className="w-full bg-[#0D113D] rounded-xl px-4 py-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-xs placeholder-white/35"
                  />
                  {searching && (
                    <span className="absolute right-3 top-3 text-[10px] text-pink-400 animate-pulse">Searching...</span>
                  )}
                </div>
              </div>

              {/* Document List */}
              {loadingDocuments ? (
                <div className="text-center py-20 text-white/60 font-semibold animate-pulse">
                  Loading repository assets...
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-20 text-white/40 text-sm italic bg-[#12184A] rounded-2xl border border-white/5">
                  🔍 No documents match your query or have been ingested yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => {
                    const isExpanded = expandedDocId === doc._id;
                    return (
                      <div
                        key={doc._id}
                        className="bg-[#12184A] rounded-2xl border border-white/5 overflow-hidden transition-all duration-200"
                      >
                        {/* Collapsed view banner header */}
                        <div
                          onClick={() => toggleExpandDocument(doc._id)}
                          className="p-5 flex justify-between items-center cursor-pointer hover:bg-[#151c57]/40 transition duration-150"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{doc.sourceType === "pdf" ? "📄" : (doc.sourceType === "email" ? "✉️" : "📅")}</span>
                            <div>
                              <div className="font-bold text-white text-md">{doc.title}</div>
                              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">
                                Type: <span className="text-pink-400">{doc.sourceType}</span> &bull; Status: <span className="text-green-400">{doc.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-white/40 text-xs font-mono">{new Date(doc.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteModal(doc._id, doc.title);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-[10px] transition cursor-pointer flex items-center justify-center gap-1"
                              title="Delete Data Source"
                            >
                              🗑️ Delete
                            </button>
                            <span className="text-white/60 text-sm transition-transform duration-200">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>

                        {/* Search matching snippet if query active */}
                        {doc.matchingSnippet && !isExpanded && (
                          <div className="px-5 pb-4 text-[11px] text-pink-300 font-mono italic bg-[#0d113d]/30 border-t border-white/5 py-2">
                            Snippet Match: "...{doc.matchingSnippet}"
                          </div>
                        )}

                        {/* Expanded Split View (Full text on Left, cached AI Summary on Right) */}
                        {isExpanded && (
                          <div className="border-t border-white/5 bg-[#090D34]/50 p-6 animate-fadeIn">
                            {loadingSummaryId === doc._id ? (
                              <div className="text-center py-12 text-xs text-white/50 font-mono animate-pulse">
                                Retrieving full text & generating AI executive summaries...
                              </div>
                            ) : expandedDocContent ? (
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Left Column: Full Text Box */}
                                <div className="lg:col-span-7 flex flex-col space-y-2">
                                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono font-bold">
                                    Raw Parsed Source Content
                                  </span>
                                  <div className="bg-[#070B42] border border-white/10 rounded-xl p-4 font-mono text-xs text-white/90 leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap select-text custom-scrollbar">
                                    {expandedDocContent.fullText}
                                  </div>
                                </div>

                                {/* Right Column: AI summary details */}
                                <div className="lg:col-span-5 space-y-4">
                                  <div className="bg-[#12184A] border border-[#FF4FA3]/20 rounded-xl p-5 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4FA3]/5 rounded-full blur-2xl pointer-events-none" />
                                    <h4 className="text-[#FF4FA3] font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
                                      <span>🧠</span> AI Executive Summary
                                    </h4>
                                    <div className="text-[11px] text-white/90 leading-relaxed font-sans font-medium whitespace-pre-line">
                                      {expandedDocContent.summary}
                                    </div>
                                  </div>

                                  <div className="bg-[#0D113D] border border-white/5 rounded-xl p-5 text-[10px] font-mono text-white/55 space-y-1.5">
                                    <div><span className="text-white/40">DB Vector Ref:</span> {doc._id}</div>
                                    <div><span className="text-white/40">Vector Index:</span> Atlas Search</div>
                                    <div><span className="text-white/40">Vector Engine:</span> xenova/all-minilm-l6-v2</div>
                                    <div><span className="text-white/40">Uploaded At:</span> {new Date(doc.createdAt).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-xs text-red-400 font-semibold font-mono">
                                Failed to parse content. Chunks list might be corrupt or missing.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Deletion Modal */}
      {deleteModalOpen && docToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              ⚠️ Confirm Permanent Deletion
            </h3>
            <p className="text-white/80 text-xs leading-relaxed">
              Are you sure you want to permanently delete data source <span className="font-bold text-[#FF4FA3]">"{docToDelete.title}"</span>? This will remove all associated parsed text chunks and index vectors.
            </p>
            
            <div className="space-y-1.5">
              <label className="block text-white/50 text-[10px] uppercase font-mono font-bold">
                Reason / Comment for deletion (Required)
              </label>
              <textarea
                value={deleteComment}
                onChange={(e) => setDeleteComment(e.target.value)}
                placeholder="Please state why you are deleting this document..."
                rows={3}
                className="w-full bg-[#0D113D] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting || !deleteComment.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs transition cursor-pointer"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
