import { useState } from "react";
import { api } from "../services/api";

const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "xml",
  "txt",
  "csv",
];

export default function DataSources() {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "jira">("upload");
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  
  // URL Scraping state
  const [urlInput, setUrlInput] = useState("");
  
  // Jira state
  const [jiraKey, setJiraKey] = useState("PROJ-404");
  const [jiraSummary, setJiraSummary] = useState("Onboarding flow has too many steps and causes drop-offs");
  const [jiraDesc, setJiraDesc] = useState("Description: The vendor registration flow requires 12 forms to be completed. Compliance officers require this to be simplified to 3 steps with OCR auto-extraction.");

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const analyzeFiles = async () => {
    if (selectedFiles.length === 0) {
      setValidationError("Please select at least one supported file.");
      return;
    }

    try {
      setValidationError("");
      setLoading(true);

      const analyzedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await api.post(
            "/sources/analyze",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          return {
            id: Date.now() + Math.random(),
            name: file.name,
            ...response.data,
          };
        })
      );

      setFiles([...analyzedFiles, ...files]);
      setSelectedFiles([]);
    } catch (error: any) {
      console.error(error);
      setValidationError(
        error.response?.data?.message || "AI analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const scrapeUrl = async () => {
    if (!urlInput.trim()) {
      setValidationError("Please provide a valid URL.");
      return;
    }
    if (!urlInput.startsWith("http://") && !urlInput.startsWith("https://")) {
      setValidationError("URL must start with http:// or https://");
      return;
    }

    try {
      setValidationError("");
      setLoading(true);

      const response = await api.post("/sources/analyze", {
        url: urlInput,
      });

      setFiles([
        {
          id: Date.now() + Math.random(),
          name: urlInput,
          ...response.data,
        },
        ...files,
      ]);
      setUrlInput("");
    } catch (error: any) {
      console.error(error);
      setValidationError(
        error.response?.data?.message || "URL scraping failed. Make sure the site is accessible."
      );
    } finally {
      setLoading(false);
    }
  };

  const importJira = async () => {
    if (!jiraKey.trim() || !jiraSummary.trim()) {
      setValidationError("Please provide a Jira Key and Summary.");
      return;
    }

    try {
      setValidationError("");
      setLoading(true);

      const jiraPayload = `[Jira Ticket ${jiraKey}]
Summary: ${jiraSummary}
${jiraDesc}`;

      const response = await api.post("/sources/analyze", {
        content: jiraPayload,
        name: `Jira: ${jiraKey}`,
      });

      setFiles([
        {
          id: Date.now() + Math.random(),
          name: `Jira: ${jiraKey} (${jiraSummary})`,
          ...response.data,
        },
        ...files,
      ]);
      setJiraKey(`PROJ-${Math.floor(100 + Math.random() * 900)}`);
      setJiraSummary("");
      setJiraDesc("");
    } catch (error: any) {
      console.error(error);
      setValidationError(
        error.response?.data?.message || "Jira ticket integration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-[#FF4FA3] bg-clip-text text-transparent">
          Project Memory System
        </h1>
        <p className="text-white/60 mt-2 text-lg">
          Upload documents, scrape urls, or connect Jira tickets to build organizational memory. Future requirement analysis automatically references this knowledge context.
        </p>
      </div>


      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => { setActiveTab("upload"); setValidationError(""); }}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl ${
            activeTab === "upload"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Upload Files (PDF, DOCX, TXT)
        </button>
        <button
          onClick={() => { setActiveTab("url"); setValidationError(""); }}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl ${
            activeTab === "url"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Scrape Web URL
        </button>
        <button
          onClick={() => { setActiveTab("jira"); setValidationError(""); }}
          className={`px-6 py-3 font-semibold transition text-sm rounded-t-xl ${
            activeTab === "jira"
              ? "bg-[#12184A] border-t border-x border-white/10 text-[#FF4FA3]"
              : "text-white/60 hover:text-white"
          }`}
        >
          Jira Integration
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-[#12184A] p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4FA3]/5 rounded-full blur-3xl pointer-events-none" />

        {activeTab === "upload" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Upload Knowledge Documents</h2>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 text-center bg-[#0D113D]/40 hover:border-[#FF4FA3]/50 transition duration-300">
              <p className="text-white/70 mb-6">
                Drag and drop or select files to ingest into vector storage. Supported: PDF, DOCX, TXT, XML, CSV.
              </p>

              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.docx,.xml,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const invalidFiles = files.filter((file) => {
                    const ext = file.name.split(".").pop()?.toLowerCase() || "";
                    return !ALLOWED_EXTENSIONS.includes(ext);
                  });

                  if (invalidFiles.length > 0) {
                    setValidationError(
                      `Unsupported file format detected:\n${invalidFiles.map(f => f.name).join("\n")}`
                    );
                    return;
                  }

                  setValidationError("");
                  setSelectedFiles(files);
                }}
              />

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold transition hover:bg-white/10 cursor-pointer"
                >
                  Choose Files
                </button>

                <button
                  onClick={analyzeFiles}
                  disabled={loading || selectedFiles.length === 0}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold transition cursor-pointer"
                >
                  {loading ? "Parsing & Ingesting..." : "Upload & Analyze"}
                </button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap justify-center gap-3">
                    {selectedFiles.map((file) => (
                      <div
                        key={file.name}
                        className="px-4 py-2 rounded-xl bg-[#0D113D] border border-white/10 text-white text-sm"
                      >
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "url" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Scrape Website Content</h2>
            <p className="text-white/60 text-sm">
              Input a public URL (e.g., architecture pages, API documentation, design systems). The AI will fetch the web content, strip HTML, split it into semantic chunks, and build the context.
            </p>

            <div className="flex gap-4">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/api-docs"
                className="flex-1 bg-[#0D113D] rounded-xl p-4 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none"
              />
              <button
                onClick={scrapeUrl}
                disabled={loading || !urlInput}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold transition cursor-pointer"
              >
                {loading ? "Scraping..." : "Scrape & Analyze"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "jira" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Jira Ticket Connector</h2>
            <p className="text-white/60 text-sm">
              Simulate Jira Webhook ingestion. Importing Jira issue descriptions builds an index of user stories, bugs, and backlog features into Project Memory.
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-white/50 text-xs mb-2">Issue ID / Key</label>
                <input
                  type="text"
                  value={jiraKey}
                  onChange={(e) => setJiraKey(e.target.value)}
                  className="w-full bg-[#0D113D] rounded-xl p-4 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-white/50 text-xs mb-2">Summary</label>
                <input
                  type="text"
                  value={jiraSummary}
                  onChange={(e) => setJiraSummary(e.target.value)}
                  className="w-full bg-[#0D113D] rounded-xl p-4 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/50 text-xs mb-2">Issue Description (Content)</label>
              <textarea
                value={jiraDesc}
                onChange={(e) => setJiraDesc(e.target.value)}
                rows={4}
                className="w-full bg-[#0D113D] rounded-xl p-4 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none"
              />
            </div>

            <button
              onClick={importJira}
              disabled={loading || !jiraSummary}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#7A39D8] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold transition cursor-pointer"
            >
              {loading ? "Ingesting Ticket..." : "Ingest Jira Ticket"}
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {validationError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
          <div className="text-red-400 font-semibold mb-2">System Notice</div>
          <pre className="whitespace-pre-wrap text-sm text-white/80 font-sans">{validationError}</pre>
        </div>
      )}

      {/* Result Section */}
      <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Ingested Sources & Project Memory</h2>

        {files.length === 0 && (
          <div className="text-white/50 py-4 text-center">
            No knowledge sources indexed in project memory yet. Ingest files above.
          </div>
        )}

        <div className="space-y-4">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedDoc(file)}
              className="bg-[#0D113D] p-5 rounded-xl border border-white/10 hover:border-[#FF4FA3]/30 transition duration-200 cursor-pointer hover:shadow-lg hover:shadow-pink-500/5 hover:bg-[#0E1346]"
              title="Click to preview parsed text content"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-bold text-lg text-white">{file.name}</div>
                  <div className="text-white/40 text-sm flex gap-2">
                    <span>Source Type: <strong className="text-white/60 uppercase">{file.sourceType}</strong></span>
                    <span>•</span>
                    <span>Chunks Created: <strong className="text-pink-400">{file.chunksCreated || 1}</strong></span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold capitalize">
                  {file.classification}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-5">
                <div className="bg-[#12184A] rounded-xl p-4 border border-white/5">
                  <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">Priority</div>
                  <div className="font-bold text-white capitalize mt-1">{file.priority}</div>
                </div>

                <div className="bg-[#12184A] rounded-xl p-4 border border-white/5">
                  <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">Confidence</div>
                  <div className="font-bold text-green-400 mt-1">{file.confidence}%</div>
                </div>

                <div className="bg-[#12184A] rounded-xl p-4 border border-white/5">
                  <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">Effort (Hours)</div>
                  <div className="font-bold text-white mt-1">{file.estimatedHours} hrs</div>
                </div>

                <div className="bg-[#12184A] rounded-xl p-4 border border-white/5">
                  <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">Complexity</div>
                  <div className="font-bold text-cyan-400 mt-1">{file.complexity}/5</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* File Parser Preview Console Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 bg-[#070926]/80 backdrop-blur-xs flex justify-center items-center p-4 overflow-y-auto animate-fadeIn select-none">
            <div className="bg-[#12184A] border border-white/10 rounded-3xl p-8 max-w-5xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4FA3]/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>📄</span> Source Code & Text Parser Preview
                  </h3>
                  <p className="text-white/40 text-xs mt-1">
                    Source file: <strong className="text-white/60">{selectedDoc.name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs border border-white/5 hover:border-white/10 transition cursor-pointer"
                >
                  ❌ Close
                </button>
              </div>

              {/* Split view body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {/* Left Side: parsed raw text */}
                <div className="md:col-span-7 flex flex-col space-y-3">
                  <h4 className="text-xs uppercase font-mono font-bold text-white/50 tracking-wider">
                    Parsed Document Raw Content
                  </h4>
                  <div className="bg-[#070B42] border border-white/10 rounded-xl p-4 font-mono text-xs text-white/90 leading-relaxed overflow-auto max-h-[450px] min-h-[250px] whitespace-pre-wrap select-text">
                    {selectedDoc.content || "Content was parsed, split, and stored in vector index chunks. (Pre-existing/loaded mockup logs do not carry active session content)."}
                  </div>
                </div>

                {/* Right Side: AI metadata inspector */}
                <div className="md:col-span-5 flex flex-col space-y-6">
                  <h4 className="text-xs uppercase font-mono font-bold text-white/50 tracking-wider">
                    AI Metadata Inspector
                  </h4>

                  {/* Metrics cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5">
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Classification</div>
                      <div className="font-bold text-white mt-1 capitalize text-sm">{selectedDoc.classification}</div>
                    </div>
                    <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5">
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Priority</div>
                      <div className="font-bold text-white mt-1 capitalize text-sm">{selectedDoc.priority}</div>
                    </div>
                    <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5">
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">AI Confidence</div>
                      <div className="font-bold text-green-400 mt-1 text-sm">{selectedDoc.confidence}%</div>
                    </div>
                    <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5">
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Effort Est.</div>
                      <div className="font-bold text-white mt-1 text-sm">{selectedDoc.estimatedHours} hrs</div>
                    </div>
                    <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5">
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Complexity</div>
                      <div className="font-bold text-cyan-400 mt-1 text-sm">{selectedDoc.complexity}/5</div>
                    </div>
                    <div className="bg-[#0D113D] rounded-xl p-4 border border-white/5">
                      <div className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Chunks Created</div>
                      <div className="font-bold text-pink-400 mt-1 text-sm">{selectedDoc.chunksCreated || 1} chunks</div>
                    </div>
                  </div>

                  {/* Vector index metadata */}
                  <div className="bg-[#0D113D] rounded-xl p-5 border border-white/5 space-y-3">
                    <span className="text-xs text-white/40 uppercase font-bold tracking-wider border-b border-white/5 pb-2 block">
                      Vector Index Specs
                    </span>
                    <div className="space-y-2 text-[11px] text-white/70 leading-relaxed font-mono">
                      <div><span className="text-white/40">Vector Database:</span> Atlas Vector Search</div>
                      <div><span className="text-white/40">Model:</span> Xenova/all-MiniLM-L6-v2</div>
                      <div><span className="text-white/40">Dimensions:</span> 384 dimensions</div>
                      <div><span className="text-white/40">Chunk Size:</span> 800 chars / overlaps</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}