import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

interface SOW {
  _id: string;
  title: string;
  clientName: string;
  mainContext: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function SOWPortal() {
  const navigate = useNavigate();
  const [sows, setSows] = useState<SOW[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [clientName, setClientName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Revision detection modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionDetails, setRevisionDetails] = useState<any>(null);

  const userStr = localStorage.getItem("brained_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchSOWs();
  }, []);

  const fetchSOWs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/sow");
      setSows(response.data.sows || []);
    } catch (err) {
      console.error("Failed to load SOW list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSOW = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientName", clientName || "Client");

    try {
      const response = await api.post("/sow/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFile(null);
      setClientName("");

      // If revision is detected, show confirmation modal
      if (response.data.isUpdate) {
        setRevisionDetails(response.data);
        setShowRevisionModal(true);
      } else {
        fetchSOWs();
      }
    } catch (err) {
      console.error("Failed to upload SOW:", err);
      alert("Error uploading SOW document. Please verify it is a valid PDF, DOCX, TXT, XML, or CSV file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSOW = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this SOW and all historical versions?")) return;

    try {
      await api.delete(`/sow/${id}`);
      fetchSOWs();
    } catch (err) {
      console.error("Failed to delete SOW document:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/95 to-[#FF4FA3] bg-clip-text text-transparent">
          📜 Statement of Work (SOW) Portal
        </h1>
        <p className="text-white/60 mt-2 text-md">
          Ingest and manage client SOW contracts, track version updates, and run AI-assisted content diff reviews.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Column: Upload Panel */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A39D8]/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-bold mb-4">Ingest SOW Document</h2>

            <form onSubmit={handleUploadSOW} className="space-y-4">
              <div>
                <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Stripe, Google"
                  required
                  className="w-full bg-[#0D113D] rounded-xl p-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none placeholder-white/20 text-sm"
                />
              </div>

              <div>
              <label className="block text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">
                Select SOW File (PDF, DOCX, TXT, XML, CSV)
              </label>
              <div className="relative border-2 border-dashed border-white/10 rounded-xl p-6 bg-[#0D113D] text-center hover:border-[#FF4FA3]/50 transition cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.xml,.csv"
                  onChange={handleFileChange}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <span className="text-3xl block">📁</span>
                  <span className="text-xs text-white/70 font-semibold block">
                    {file ? file.name : "Click or drag SOW document here"}
                  </span>
                  <span className="text-[10px] text-white/30 block">Supports PDF, DOCX, TXT, XML, CSV</span>
                </div>
              </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !file}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7A39D8] via-[#B637BF] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold tracking-wide transition shadow-lg cursor-pointer"
              >
                {uploading ? "Parsing SOW File..." : "Ingest SOW Document"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: SOW Document Catalog */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white mb-2">SOW Catalog</h2>

            {loading ? (
              <div className="text-center text-white/50 text-sm py-12">Loading client SOW catalog...</div>
            ) : sows.length === 0 ? (
              <div className="text-center text-white/40 text-xs py-12">
                No Statement of Work (SOW) documents have been ingested yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sows.map((sow) => (
                  <div
                    key={sow._id}
                    onClick={() => navigate(`/sow/${sow._id}`)}
                    className="bg-[#0D113D] border border-white/5 hover:border-[#FF4FA3]/50 p-5 rounded-xl text-left cursor-pointer transition flex flex-col justify-between min-h-[160px] group hover:scale-[1.01] relative shadow-lg"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#FF4FA3]/15 text-[#FF4FA3] font-mono text-[9px] uppercase tracking-wider font-bold">
                          {sow.clientName}
                        </span>
                        <span className="text-[10px] text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          V{sow.currentVersion}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-sm leading-snug line-clamp-2 pr-4">{sow.title}</h3>
                      <p className="text-white/40 text-[10px] mt-2 font-semibold">
                        Uploaded: {new Date(sow.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4 border-t border-white/5 pt-3">
                      <span className="text-[10px] text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1">
                        Timeline & Updates &rarr;
                      </span>
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteSOW(sow._id, e)}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold transition z-10"
                        >
                          🗑️ Delete SOW
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SOW Revision Detected Confirmation Modal */}
      {showRevisionModal && revisionDetails && (
        <div className="fixed inset-0 bg-[#070926]/85 backdrop-blur-xs flex justify-center items-center z-[9999] animate-fadeIn">
          <div className="bg-[#12184A] border border-white/10 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                <span>⚠️</span> SOW Revision Detected
              </h3>
              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] font-bold">
                DRAFT V{revisionDetails.update.versionNumber}
              </span>
            </div>

            <div>
              <p className="text-white/80 text-xs leading-relaxed">
                An SOW with the title <strong className="text-white">"{revisionDetails.sow.title}"</strong> has already been ingested. We detected the following AI-extracted differences between this new upload and the existing Main SOW context:
              </p>
            </div>

            {/* Change list preview */}
            <div className="bg-[#0D113D] border border-white/5 rounded-xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar space-y-2 text-xs">
              {revisionDetails.changes && revisionDetails.changes.length > 0 ? (
                revisionDetails.changes.map((change: any, idx: number) => {
                  let badgeColor = "bg-green-500/20 text-green-300";
                  if (change.changeType === "modification") badgeColor = "bg-yellow-500/20 text-yellow-300";
                  if (change.changeType === "deletion") badgeColor = "bg-red-500/20 text-red-300";

                  return (
                    <div key={idx} className="flex justify-between items-start gap-4 border-b border-white/5 pb-2 last:border-b-0">
                      <div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${badgeColor} mr-2`}>
                          {change.changeType}
                        </span>
                        <strong className="text-white">{change.section}</strong>
                        <p className="text-white/60 text-[11px] mt-0.5">{change.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-white/40 text-[11px] italic text-center py-4">No content diffs detected. Re-upload matches main context exactly.</div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  fetchSOWs();
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition cursor-pointer"
              >
                Keep as Draft Version
              </button>
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  navigate(`/sow/${revisionDetails.sow._id}?pendingUpdateId=${revisionDetails.update._id}`);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 text-white font-bold text-xs transition cursor-pointer shadow-md"
              >
                Review and Merge Diffs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
