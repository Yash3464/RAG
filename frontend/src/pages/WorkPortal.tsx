import { useEffect, useState, useRef } from "react";
import { api } from "../services/api";

interface BacklogItem {
  _id: string;
  content: string;
  classification: string;
  priority: string;
  priorityScore: number;
  estimatedDevelopmentHours: number;
  estimatedTestingHours: number;
  complexityScore: number;
}

type ActivityStatus = "active" | "inactive" | "afk";

export default function WorkPortal() {
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskSource, setTaskSource] = useState<"backlog" | "custom">("backlog");

  // Selection state
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<BacklogItem | null>(null);

  // Custom task state
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customPriority, setCustomPriority] = useState("medium");
  const [customHours, setCustomHours] = useState(4);

  // Activity & Session state
  const [status, setStatus] = useState<ActivityStatus>("inactive");
  const [isWorking, setIsWorking] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [workHistory, setWorkHistory] = useState<any[]>([]);

  const timerRef = useRef<any>(null);

  // Sync elapsed seconds via ref to prevent heartbeat from refiring every second
  const secondsElapsedRef = useRef(0);
  useEffect(() => {
    secondsElapsedRef.current = secondsElapsed;
  }, [secondsElapsed]);

  const reportStatusToBackend = async (
    currentStatus: ActivityStatus,
    working: boolean,
    taskTitle: string
  ) => {
    try {
      await api.post("/employees/status", {
        status: currentStatus,
        isWorking: working,
        currentTask: working ? taskTitle : "",
        secondsElapsed: secondsElapsedRef.current,
      });
    } catch (err) {
      console.error("Failed to report status to backend:", err);
    }
  };

  // Heartbeat to report real-time status to backend
  useEffect(() => {
    const taskName = taskSource === "backlog" ? selectedTask?.content || "" : customTitle;
    reportStatusToBackend(status, isWorking, taskName);

    let heartbeatInterval: any = null;
    if (isWorking) {
      heartbeatInterval = setInterval(() => {
        reportStatusToBackend(status, isWorking, taskName);
      }, 10000); // 10-second heartbeat
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isWorking, status, selectedTask, customTitle, taskSource]);

  // Load backlog tasks
  useEffect(() => {
    loadBacklog();
    restoreSession();
    loadWorkHistory();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadWorkHistory = () => {
    const saved = localStorage.getItem("brained_work_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.map((item: any) => ({
          ...item,
          hours: item.hours ? Math.round(item.hours * 2) / 2 : 0
        }));
        localStorage.setItem("brained_work_history", JSON.stringify(cleaned));
        setWorkHistory(cleaned);
        return;
      } catch {}
    }
    
    // Initialize with mock data for the last 14 days to make the sparkline look alive!
    const mockHistory = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      let hours = 0;
      let taskName = "";
      if (i % 3 !== 0) {
        hours = Math.floor(2 + Math.random() * 6) + (Math.random() > 0.5 ? 0.5 : 0);
        taskName = i % 2 === 0 ? "Refactored user dashboard components" : "Fixed edge case validation rules";
      }
      
      mockHistory.push({
        date: dateStr,
        hours,
        taskName
      });
    }
    localStorage.setItem("brained_work_history", JSON.stringify(mockHistory));
    setWorkHistory(mockHistory);
  };

  // Save session state to local storage when things change
  useEffect(() => {
    if (isWorking) {
      localStorage.setItem(
        "brained_session",
        JSON.stringify({
          taskSource,
          selectedTaskId,
          selectedTask,
          customTitle,
          customDesc,
          customPriority,
          customHours,
          status,
          isWorking,
          secondsElapsed,
          isFocusMode,
          timestamp: Date.now(),
        })
      );
    } else {
      localStorage.removeItem("brained_session");
    }
  }, [
    taskSource,
    selectedTaskId,
    selectedTask,
    customTitle,
    customDesc,
    customPriority,
    customHours,
    status,
    isWorking,
    secondsElapsed,
    isFocusMode,
  ]);

  // Handle active timer increments
  useEffect(() => {
    if (isWorking && status === "active") {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorking, status]);

  const loadBacklog = async () => {
    try {
      setLoading(true);
      const response = await api.get("/backlog");
      const data = response.data;
      const activeItems = [
        ...(data?.release1 || []),
        ...(data?.release2 || []),
        ...(data?.release3 || []),
      ];
      setBacklog(activeItems);
    } catch (error) {
      console.error("Failed to load backlog for task picker:", error);
    } finally {
      setLoading(false);
    }
  };

  const restoreSession = () => {
    const saved = localStorage.getItem("brained_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTaskSource(parsed.taskSource || "backlog");
        setSelectedTaskId(parsed.selectedTaskId || "");
        setSelectedTask(parsed.selectedTask || null);
        setCustomTitle(parsed.customTitle || "");
        setCustomDesc(parsed.customDesc || "");
        setCustomPriority(parsed.customPriority || "medium");
        setCustomHours(parsed.customHours || 4);
        setStatus(parsed.status || "inactive");
        setIsWorking(parsed.isWorking || false);
        setIsFocusMode(parsed.isFocusMode || false);

        // Adjust elapsed time based on elapsed real-world time if status was active
        if (parsed.status === "active" && parsed.isWorking && parsed.timestamp) {
          const deltaSeconds = Math.floor((Date.now() - parsed.timestamp) / 1000);
          setSecondsElapsed((parsed.secondsElapsed || 0) + deltaSeconds);
        } else {
          setSecondsElapsed(parsed.secondsElapsed || 0);
        }
      } catch (e) {
        console.error("Failed to parse saved session:", e);
      }
    }
  };

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    const item = backlog.find((b) => b._id === taskId) || null;
    setSelectedTask(item);
  };

  const startWorkSession = () => {
    if (taskSource === "backlog" && !selectedTaskId) return;
    if (taskSource === "custom" && !customTitle.trim()) return;

    setIsWorking(true);
    setStatus("active");
    setSecondsElapsed(0);
    setIsFocusMode(true);
  };

  const endWorkSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const hoursLogged = Math.max(0.1, Number((secondsElapsed / 3600).toFixed(1)));
    const taskName = taskSource === "backlog" ? selectedTask?.content || "Backlog Task" : customTitle;
    
    if (secondsElapsed > 0) {
      const newRecord = {
        date: new Date().toISOString().split("T")[0],
        hours: hoursLogged,
        taskName: taskName.substring(0, 50) + (taskName.length > 50 ? "..." : "")
      };
      
      const currentHistoryStr = localStorage.getItem("brained_work_history");
      let history = [];
      if (currentHistoryStr) {
        try {
          history = JSON.parse(currentHistoryStr);
        } catch {}
      }
      history.push(newRecord);
      localStorage.setItem("brained_work_history", JSON.stringify(history));
      setWorkHistory(history);
    }

    setIsWorking(false);
    setStatus("inactive");
    setSecondsElapsed(0);
    setIsFocusMode(false);
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  const getStatusLabelColor = (s: ActivityStatus) => {
    switch (s) {
      case "active":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "afk":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "inactive":
        return "text-slate-400 bg-slate-500/10 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-[#FF4FA3] bg-clip-text text-transparent">
          Work Portal & Activity Tracker
        </h1>
        <p className="text-white/60 mt-2 text-lg">
          Select tasks from the backlog, log custom items, and manage your real-time activity status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Setup Work Session */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>💼</span> Setup Current Task
            </h2>

            {isWorking ? (
              <div className="space-y-6 bg-[#0D113D]/60 p-6 rounded-xl border border-white/5 text-center">
                <div className="text-white/50 text-sm">You have an active session running.</div>
                <div className="text-2xl font-black text-white truncate max-w-full">
                  {taskSource === "backlog" ? selectedTask?.content : customTitle}
                </div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={endWorkSession}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90 text-white font-bold text-sm transition cursor-pointer shadow-lg shadow-red-600/15"
                  >
                    ⏹️ Stop Work Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Source Selection Toggle */}
                <div className="flex bg-[#0D113D] p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setTaskSource("backlog")}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition cursor-pointer ${
                      taskSource === "backlog"
                        ? "bg-gradient-to-r from-[#7A39D8] to-[#E238A7] text-white shadow-lg"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    📋 Choose from Backlog
                  </button>
                  <button
                    onClick={() => setTaskSource("custom")}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-xs transition cursor-pointer ${
                      taskSource === "custom"
                        ? "bg-gradient-to-r from-[#7A39D8] to-[#E238A7] text-white shadow-lg"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    ✏️ Type Custom Task
                  </button>
                </div>

                {taskSource === "backlog" ? (
                  /* Option A: Choose from Backlog */
                  <div className="space-y-4">
                    <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider font-mono">
                      Select Backlog Requirement / Issue
                    </label>
                    {loading ? (
                      <div className="text-white/50 text-xs py-2 animate-pulse">Loading active backlog items...</div>
                    ) : backlog.length === 0 ? (
                      <div className="text-white/30 text-xs py-2 italic">No active backlog tasks available.</div>
                    ) : (
                      <select
                        value={selectedTaskId}
                        onChange={(e) => handleTaskChange(e.target.value)}
                        className="w-full bg-[#0D113D] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#FF4FA3]/50 cursor-pointer"
                      >
                        <option value="">-- Choose a Backlog Task --</option>
                        {backlog.map((item) => (
                          <option key={item._id} value={item._id}>
                            [{item.classification.toUpperCase()} - {item.priority.toUpperCase()}] {item.content.substring(0, 75)}...
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  /* Option B: Write Custom Task Details */
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                        Task Summary / Title
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Design login layout with glassmorphic cards"
                        className="w-full bg-[#0D113D] rounded-xl px-4 py-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-sm placeholder-white/20 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                        Task Description / Specification Details
                      </label>
                      <textarea
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        placeholder="Detail the sub-components, objectives, and acceptance criteria..."
                        rows={4}
                        className="w-full bg-[#0D113D] rounded-xl p-4 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-sm placeholder-white/20 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                          Priority Label
                        </label>
                        <select
                          value={customPriority}
                          onChange={(e) => setCustomPriority(e.target.value)}
                          className="w-full bg-[#0D113D] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#FF4FA3]/50 cursor-pointer"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
                          Target Effort (Hours)
                        </label>
                        <input
                          type="number"
                          value={customHours}
                          onChange={(e) => setCustomHours(Number(e.target.value))}
                          min={1}
                          max={100}
                          className="w-full bg-[#0D113D] rounded-xl px-4 py-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={startWorkSession}
                  disabled={
                    isWorking ||
                    (taskSource === "backlog" && !selectedTaskId) ||
                    (taskSource === "custom" && !customTitle.trim())
                  }
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7A39D8] via-[#B637BF] to-[#E238A7] hover:opacity-95 disabled:opacity-40 text-white font-black tracking-wide transition shadow-lg shadow-pink-500/10 cursor-pointer text-sm"
                >
                  🚀 Start Work Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Workspace & Status Picker */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-time Status Card */}
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>⚡</span> Activity Status
            </h2>

            {/* Glowing Radio selectors */}
            <div className="grid grid-cols-3 gap-3">
              {/* Active Option */}
              <button
                onClick={() => setStatus("active")}
                className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer relative overflow-hidden ${
                  status === "active"
                    ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    : "bg-[#0D113D] border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-2xl">🟢</span>
                <span className="text-xs font-bold text-white">Active</span>
                {status === "active" && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* AFK Option */}
              <button
                onClick={() => setStatus("afk")}
                className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer relative overflow-hidden ${
                  status === "afk"
                    ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-[#0D113D] border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-2xl">🟡</span>
                <span className="text-xs font-bold text-white">AFK</span>
                {status === "afk" && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              {/* Inactive Option */}
              <button
                onClick={() => setStatus("inactive")}
                className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer relative overflow-hidden ${
                  status === "inactive"
                    ? "bg-slate-500/20 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.15)]"
                    : "bg-[#0D113D] border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-2xl">🔴</span>
                <span className="text-xs font-bold text-white">Inactive</span>
              </button>
            </div>
          </div>

          {/* Current Session Tracker Card */}
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>⏱️</span> Session Statistics
            </h2>

            {isWorking ? (
              <div className="space-y-6">
                {/* Visual Status Indicator Bar */}
                <div className="flex justify-between items-center bg-[#0D113D] rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-wider">Status</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusLabelColor(status)}`}>
                    {status}
                  </span>
                </div>

                {/* Live Work Timer */}
                <div className="bg-[#0D113D] rounded-xl p-5 border border-white/5 text-center space-y-2 relative overflow-hidden">
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-wider">Active Time Spent</div>
                  <div className="text-4xl font-mono font-black tracking-widest text-[#FF4FA3]">
                    {formatTime(secondsElapsed)}
                  </div>
                  {status !== "active" && (
                    <div className="text-[10px] text-amber-400/80 animate-pulse">Timer Paused (AFK / Inactive)</div>
                  )}
                </div>

                {/* Selected Task Details Display */}
                <div className="bg-[#0D113D] rounded-xl p-5 border border-white/5 space-y-4">
                  <div className="text-xs text-white/40 uppercase font-bold tracking-wider border-b border-white/5 pb-2">
                    Current Task Details
                  </div>

                  {taskSource === "backlog" && selectedTask ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-white/40 block">Classification</span>
                        <span className="text-xs font-bold text-[#FF4FA3] capitalize">{selectedTask.classification}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block">Task Content</span>
                        <p className="text-xs text-white/80 leading-relaxed max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                          {selectedTask.content}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                        <div>
                          <span className="text-white/40 block">Priority Score</span>
                          <span className="text-white font-semibold">{selectedTask.priorityScore} (Score)</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Complexity Score</span>
                          <span className="text-white font-semibold">{selectedTask.complexityScore}/5</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Development Effort</span>
                          <span className="text-white font-semibold">{selectedTask.estimatedDevelopmentHours} hrs</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Testing Effort</span>
                          <span className="text-white font-semibold">{selectedTask.estimatedTestingHours} hrs</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-white/40 block font-mono">Title</span>
                        <span className="text-xs font-bold text-white">{customTitle}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block font-mono">Description</span>
                        <p className="text-xs text-white/80 leading-relaxed max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                          {customDesc || "No additional description entered."}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                        <div>
                          <span className="text-white/40 block font-mono">Priority</span>
                          <span className="text-white font-semibold capitalize">{customPriority}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block font-mono font-semibold">Total Est. Hours</span>
                          <span className="text-white font-semibold">{customHours} hrs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Focus Mode button */}
                <button
                  onClick={() => setIsFocusMode(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 text-white font-bold text-xs transition shadow-lg shadow-pink-500/10 cursor-pointer mt-4 flex items-center justify-center gap-1.5 animate-pulse"
                >
                  🖥️ Maximize to Focus Mode
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-white/30 text-sm italic">
                No active work session started. Setup a task on the left and click "Start Work Session" to track time.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Productivity Sparkline Section */}
      <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span>📅</span> Productivity Sparkline (Last 14 Days)
        </h2>
        <p className="text-white/40 text-xs mb-6">Visual contribution grid of engineering hours logged. Hover for details.</p>
        
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex gap-2">
            {workHistory.slice(-14).map((record, index) => {
              const h = record.hours;
              let bgClass = "bg-white/5 border border-white/5";
              if (h > 0 && h <= 3) bgClass = "bg-[#7A39D8]/30 border border-[#7A39D8]/45";
              else if (h > 3 && h <= 6) bgClass = "bg-[#7A39D8]/70 border border-[#7A39D8]/80";
              else if (h > 6) bgClass = "bg-[#FF4FA3] border border-[#FF4FA3]/20 shadow-lg shadow-[#FF4FA3]/20";

              const displayDate = new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              return (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-lg ${bgClass} flex flex-col items-center justify-center relative group cursor-help transition-all duration-200 hover:scale-110`}
                >
                  <span className="text-[10px] font-black text-white/90">{h > 0 ? `${h}h` : "—"}</span>
                  {/* Floating Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-[#0D113D] border border-white/15 p-2.5 rounded-xl text-[10px] text-white shadow-2xl pointer-events-none z-50 animate-fadeIn font-normal">
                    <div className="font-bold text-[#FF4FA3]">{displayDate}</div>
                    <div className="font-semibold mt-0.5">{h > 0 ? `${h} Hours Logged` : "No hours logged"}</div>
                    {record.taskName && <div className="text-white/60 mt-1 italic line-clamp-2">"{record.taskName}"</div>}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] text-white/50 font-mono font-bold bg-[#0D113D]/40 px-4 py-2 border border-white/5 rounded-xl">
            <span>Less</span>
            <div className="w-4 h-4 rounded bg-white/5 border border-white/5" />
            <div className="w-4 h-4 rounded bg-[#7A39D8]/30 border border-[#7A39D8]/45" />
            <div className="w-4 h-4 rounded bg-[#7A39D8]/70 border border-[#7A39D8]/80" />
            <div className="w-4 h-4 rounded bg-[#FF4FA3] border border-[#FF4FA3]/20 shadow shadow-[#FF4FA3]/20" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Focus Mode Overlay */}
      {isFocusMode && (
        <div className="fixed inset-0 z-[9999] bg-[#05072B] flex flex-col justify-between p-12 overflow-y-auto animate-fadeIn select-none">
          {/* Glowing Background Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7A39D8]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF4FA3]/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Header */}
          <div className="flex justify-between items-center z-10 border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#FF4FA3] tracking-wider">BRAINED</h1>
              <span className="text-[10px] bg-pink-500/20 text-pink-400 font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-pink-500/20">
                Session Focus Mode
              </span>
            </div>
            
            <button
              onClick={() => setIsFocusMode(false)}
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs border border-white/15 hover:border-white/20 transition cursor-pointer"
            >
              🚪 Minimize Focus Mode
            </button>
          </div>

          {/* Center content: Holographic Timer & Task details */}
          <div className="flex-1 flex flex-col justify-center items-center max-w-3xl mx-auto w-full z-10 py-12 space-y-12 animate-fadeIn">
            <div className="text-center space-y-4">
              <div className="text-xs text-white/40 uppercase tracking-widest font-mono font-bold">Active Focus Duration</div>
              <div className="text-7xl md:text-8xl font-black font-mono tracking-widest text-[#FF4FA3] drop-shadow-[0_0_25px_rgba(255,79,163,0.35)] animate-pulse">
                {formatTime(secondsElapsed)}
              </div>
              {status !== "active" && (
                <div className="text-xs text-amber-400 font-bold uppercase tracking-widest font-mono animate-pulse mt-2">
                  ⏸️ Session Paused
                </div>
              )}
            </div>

            {/* Active Task Details */}
            <div className="w-full bg-[#12184A]/60 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-xs text-white/40 uppercase font-mono font-bold">Currently Working On</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${getStatusLabelColor(status)}`}>
                  {status}
                </span>
              </div>

              {taskSource === "backlog" && selectedTask ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white tracking-wide">{selectedTask.content}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4 border-t border-white/5">
                    <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                      <span className="text-white/40 block">Classification</span>
                      <span className="text-[#FF4FA3] font-bold capitalize mt-0.5 block">{selectedTask.classification}</span>
                    </div>
                    <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                      <span className="text-white/40 block">Priority</span>
                      <span className="text-white font-bold capitalize mt-0.5 block">{selectedTask.priority}</span>
                    </div>
                    <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                      <span className="text-white/40 block">Est. Development</span>
                      <span className="text-white font-bold mt-0.5 block">{selectedTask.estimatedDevelopmentHours} hrs</span>
                    </div>
                    <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                      <span className="text-white/40 block">Complexity Score</span>
                      <span className="text-cyan-400 font-bold mt-0.5 block">{selectedTask.complexityScore}/5</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white tracking-wide">{customTitle}</h2>
                  <p className="text-white/70 text-sm leading-relaxed max-h-36 overflow-y-auto">{customDesc || "No description provided."}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-white/5">
                    <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                      <span className="text-white/40 block font-mono">Priority</span>
                      <span className="text-white font-bold capitalize mt-0.5 block">{customPriority}</span>
                    </div>
                    <div className="bg-[#0D113D] p-3 rounded-xl border border-white/5">
                      <span className="text-white/40 block font-mono">Est. Time</span>
                      <span className="text-white font-bold mt-0.5 block">{customHours} hrs</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick status selector */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <button
                onClick={() => setStatus("active")}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative overflow-hidden ${
                  status === "active"
                    ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] text-emerald-400"
                    : "bg-[#0D113D]/40 border-white/5 hover:border-white/10 text-white/60"
                }`}
              >
                <span className="text-lg">🟢</span>
                <span className="text-xs font-bold">Active</span>
              </button>
              <button
                onClick={() => setStatus("afk")}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative overflow-hidden ${
                  status === "afk"
                    ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-amber-400"
                    : "bg-[#0D113D]/40 border-white/5 hover:border-white/10 text-white/60"
                }`}
              >
                <span className="text-lg">🟡</span>
                <span className="text-xs font-bold">AFK</span>
              </button>
              <button
                onClick={() => setStatus("inactive")}
                className={`py-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer relative overflow-hidden ${
                  status === "inactive"
                    ? "bg-slate-500/20 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.15)] text-slate-400"
                    : "bg-[#0D113D]/40 border-white/5 hover:border-white/10 text-white/60"
                }`}
              >
                <span className="text-lg">🔴</span>
                <span className="text-xs font-bold">Inactive</span>
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex justify-center z-10 pt-6 border-t border-white/5">
            <button
              onClick={endWorkSession}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90 text-white font-black text-sm tracking-wide transition shadow-xl shadow-red-600/20 cursor-pointer"
            >
              ⏹️ Stop Work Session & Exit Focus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
