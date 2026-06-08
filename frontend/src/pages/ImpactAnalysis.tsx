import { useState } from "react";
import { api } from "../services/api";

export default function ImpactAnalysis() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const analyzeImpact = async () => {
    try {
      setLoading(true);
      setActiveLayer(null);

      const response = await api.post("/impact/analyze", {
        content,
      });

      setResult(response.data.impact);
    } catch (error: any) {
      console.error(error);
      setResult({
        relevant: false,
        message: error.response?.data?.message || "Impact analysis failed",
        suggestion: "Please try again with a descriptive requirement.",
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveLayer(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Counting helper
  const getCount = (arr: any) => (arr ? arr.length : 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-[#FF4FA3] bg-clip-text text-transparent">
          Enterprise Architectural Impact Analysis
        </h1>
        <p className="text-white/60 mt-2 text-lg">
          Determine the domino effect of business requirements and changes across pages, APIs, database tables, roles, security, and deployments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7A39D8]/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-bold mb-4 text-white">Requirement Input</h2>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full bg-[#0D113D] rounded-xl p-4 border border-white/10 text-white focus:border-[#FF4FA3]/50 focus:outline-none placeholder-white/30 text-sm leading-relaxed"
              placeholder="Example: Implement Google OAuth login for vendors, checking their compliance status before showing the dashboard and storing user sessions in a new session table."
            />

            <button
              onClick={analyzeImpact}
              disabled={loading || !content.trim()}
              className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-[#7A39D8] via-[#B637BF] to-[#E238A7] hover:opacity-90 disabled:opacity-40 text-white font-bold tracking-wide transition shadow-lg cursor-pointer"
            >
              {loading ? "Analyzing Impact..." : "Run Impact Analysis"}
            </button>
          </div>

          {result && result.relevant !== false && (
            <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-white">Impact Scorecard</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50 text-sm">Risk Assessment</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    result.riskLevel === "high" ? "bg-red-500/20 text-red-400" :
                    result.riskLevel === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {result.riskLevel || "low"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50 text-sm">Estimated Refactor Time</span>
                  <span className="text-pink-400 font-bold text-lg">{result.estimatedHours || 0} hrs</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50 text-sm">Relevance Score</span>
                  <span className="text-green-400 font-bold text-lg">{result.relevanceScore || 100}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/50 text-sm">Business Value</span>
                  <span className="text-yellow-400 font-bold capitalize">{result.businessValue || "medium"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Output visualization panel */}
        <div className="lg:col-span-8 space-y-6">
          {!result && (
            <div className="bg-[#12184A] p-12 rounded-2xl border border-white/10 text-center text-white/50 shadow-2xl">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-xl font-bold text-white mb-2">Architectural Map Ready</h3>
              <p className="max-w-md mx-auto">
                Enter a business rule, requirement, or ticket description on the left to map its technical impact across the enterprise architecture.
              </p>
            </div>
          )}

          {result && result.relevant === false && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 shadow-xl">
              <h3 className="text-red-400 font-bold text-2xl flex items-center gap-2">
                ⚠️ Input Rejected
              </h3>
              <p className="mt-4 text-white/80 leading-relaxed">{result.message}</p>
              <p className="mt-4 text-white/50 text-sm italic">{result.suggestion}</p>
            </div>
          )}

          {result && result.relevant !== false && (
            <div className="space-y-8">
              {/* Architecture Map Header */}
              <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-xl relative">
                <h3 className="text-2xl font-bold mb-2">Interactive Architecture Map</h3>
                <p className="text-white/50 text-sm mb-6">
                  Click any layer node below to inspect specific source impact and highlight details.
                </p>

                {/* SVG Visual Flow Graph */}
                <div className="relative bg-[#0D113D] border border-white/10 rounded-xl p-8 flex flex-col items-center justify-between min-h-[360px] overflow-hidden">
                  
                  {/* Flowing background lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7A39D8" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#B637BF" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#FF4FA3" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="flow-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7A39D8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#FF4FA3" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {/* Flow Lines */}
                    {/* Requirement Node to Layers */}
                    <path d="M 350 50 C 350 90, 120 90, 120 120" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" />
                    <path d="M 350 50 C 350 90, 350 90, 350 120" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" />
                    <path d="M 350 50 C 350 90, 580 90, 580 120" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" />

                    {/* Layer to Layer Connections */}
                    <path d="M 120 170 C 120 200, 350 200, 350 220" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" />
                    <path d="M 350 170 C 350 200, 350 200, 350 220" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" />
                    <path d="M 580 170 C 580 200, 350 200, 350 220" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" />

                    {/* Security & Deployment to others */}
                    <path d="M 235 270 C 235 300, 465 300, 465 320" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" strokeDasharray="4 4" />
                    <path d="M 465 270 C 465 300, 235 300, 235 320" stroke="url(#flow-gradient)" strokeWidth="2" fill="none" className="opacity-40" strokeDasharray="4 4" />
                  </svg>

                  {/* Level 1: Requirement Entry */}
                  <div className="z-10 w-full max-w-[280px]">
                    <div className="bg-gradient-to-r from-[#7A39D8]/20 to-[#E238A7]/20 border border-[#FF4FA3]/50 rounded-xl p-3 text-center shadow-lg backdrop-blur-sm">
                      <div className="text-[10px] text-[#FF4FA3] font-bold uppercase tracking-wider">Requirement Input</div>
                      <div className="text-xs font-semibold text-white truncate mt-1">
                        {result.interpretedRequirement || content}
                      </div>
                    </div>
                  </div>

                  {/* Level 2: Core Architecture Layers (UI, API, Data) */}
                  <div className="z-10 w-full flex justify-between gap-4 mt-6">
                    {/* UI Layer */}
                    <button
                      onClick={() => scrollToSection("layer-ui")}
                      className={`flex-1 max-w-[200px] p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === "layer-ui"
                          ? "bg-[#FF4FA3]/20 border-[#FF4FA3] shadow-lg shadow-[#FF4FA3]/15 scale-105"
                          : "bg-[#12184A]/90 border-white/10 hover:border-[#FF4FA3]/40"
                      }`}
                    >
                      <div className="text-lg">🖥️</div>
                      <div className="text-xs font-bold text-white mt-1">UI & Pages</div>
                      <div className="text-[10px] text-white/50 mt-1">
                        {getCount(result.structureImpact?.pages) + getCount(result.structureImpact?.sections)} impacted
                      </div>
                    </button>

                    {/* API Layer */}
                    <button
                      onClick={() => scrollToSection("layer-api")}
                      className={`flex-1 max-w-[200px] p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === "layer-api"
                          ? "bg-[#B637BF]/20 border-[#B637BF] shadow-lg shadow-[#B637BF]/15 scale-105"
                          : "bg-[#12184A]/90 border-white/10 hover:border-[#B637BF]/40"
                      }`}
                    >
                      <div className="text-lg">🔌</div>
                      <div className="text-xs font-bold text-white mt-1">APIs & Logic</div>
                      <div className="text-[10px] text-white/50 mt-1">
                        {getCount(result.businessLogicImpact?.apis) + getCount(result.businessLogicImpact?.workflows)} impacted
                      </div>
                    </button>

                    {/* DB Layer */}
                    <button
                      onClick={() => scrollToSection("layer-db")}
                      className={`flex-1 max-w-[200px] p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === "layer-db"
                          ? "bg-[#7A39D8]/20 border-[#7A39D8] shadow-lg shadow-[#7A39D8]/15 scale-105"
                          : "bg-[#12184A]/90 border-white/10 hover:border-[#7A39D8]/40"
                      }`}
                    >
                      <div className="text-lg">🗄️</div>
                      <div className="text-xs font-bold text-white mt-1">Database</div>
                      <div className="text-[10px] text-white/50 mt-1">
                        {getCount(result.datasetImpact?.newTables) + getCount(result.datasetImpact?.modifiedTables)} tables
                      </div>
                    </button>
                  </div>

                  {/* Level 3: Cross-Cutting Layers (Security & Deployment) */}
                  <div className="z-10 w-full flex justify-around gap-8 mt-6">
                    {/* Security Layer */}
                    <button
                      onClick={() => scrollToSection("layer-security")}
                      className={`w-full max-w-[240px] p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === "layer-security"
                          ? "bg-red-500/20 border-red-500 shadow-lg shadow-red-500/15 scale-105"
                          : "bg-[#12184A]/90 border-white/10 hover:border-red-500/40"
                      }`}
                    >
                      <div className="text-lg">🛡️</div>
                      <div className="text-xs font-bold text-white mt-1">Security & Compliance</div>
                      <div className="text-[10px] text-white/50 mt-1">
                        {getCount(result.securityImpact?.permissions) + getCount(result.securityImpact?.compliance)} rules
                      </div>
                    </button>

                    {/* Deployment Layer */}
                    <button
                      onClick={() => scrollToSection("layer-deployment")}
                      className={`w-full max-w-[240px] p-4 rounded-xl border text-center transition-all cursor-pointer ${
                        activeLayer === "layer-deployment"
                          ? "bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/15 scale-105"
                          : "bg-[#12184A]/90 border-white/10 hover:border-cyan-500/40"
                      }`}
                    >
                      <div className="text-lg">🚀</div>
                      <div className="text-xs font-bold text-white mt-1">Deployment & Infra</div>
                      <div className="text-[10px] text-white/50 mt-1">
                        {getCount(result.deploymentImpact?.infrastructure) + getCount(result.deploymentImpact?.pipelines)} targets
                      </div>
                    </button>
                  </div>

                </div>
              </div>

              {/* AI Verdict */}
              <div className="bg-[#12184A] p-6 rounded-2xl border border-white/10 shadow-lg">
                <h3 className="text-xl font-bold mb-3 text-pink-400">Architectural Verdict</h3>
                <p className="text-white/80 leading-relaxed text-sm">
                  {result.aiVerdict}
                </p>
              </div>

              {/* Detailed Breakdown List */}
              <div className="space-y-6">

                {/* UI & Pages Layer Details */}
                <div
                  id="layer-ui"
                  className={`bg-[#12184A] p-6 rounded-2xl border transition-all duration-300 ${
                    activeLayer === "layer-ui" ? "border-[#FF4FA3] shadow-lg shadow-[#FF4FA3]/5" : "border-white/10"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <span>🖥️</span> UI & Pages Impact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Impacted Pages</div>
                      {getCount(result.structureImpact?.pages) === 0 ? (
                        <div className="text-white/40 text-xs">No pages impacted</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.structureImpact?.pages.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Sections & Components</div>
                      {getCount(result.structureImpact?.sections) === 0 ? (
                        <div className="text-white/40 text-xs">No specific sections impacted</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.structureImpact?.sections.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* API & Logic Details */}
                <div
                  id="layer-api"
                  className={`bg-[#12184A] p-6 rounded-2xl border transition-all duration-300 ${
                    activeLayer === "layer-api" ? "border-[#B637BF] shadow-lg shadow-[#B637BF]/5" : "border-white/10"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <span>🔌</span> APIs & Business Logic Impact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">API Endpoints</div>
                      {getCount(result.businessLogicImpact?.apis) === 0 ? (
                        <div className="text-white/40 text-xs">No APIs impacted</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.businessLogicImpact?.apis.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Workflows & Logic Flow</div>
                      {getCount(result.businessLogicImpact?.workflows) === 0 ? (
                        <div className="text-white/40 text-xs">No workflows affected</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.businessLogicImpact?.workflows.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Database Details */}
                <div
                  id="layer-db"
                  className={`bg-[#12184A] p-6 rounded-2xl border transition-all duration-300 ${
                    activeLayer === "layer-db" ? "border-[#7A39D8] shadow-lg shadow-[#7A39D8]/5" : "border-white/10"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <span>🗄️</span> Database Schema Impact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">New Tables Required</div>
                      {getCount(result.datasetImpact?.newTables) === 0 ? (
                        <div className="text-white/40 text-xs">No new tables required</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.datasetImpact?.newTables.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-green-400 font-medium">+ {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Modified Tables</div>
                      {getCount(result.datasetImpact?.modifiedTables) === 0 ? (
                        <div className="text-white/40 text-xs">No database modifications</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.datasetImpact?.modifiedTables.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-yellow-400 font-medium">~ {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Security & Compliance Details */}
                <div
                  id="layer-security"
                  className={`bg-[#12184A] p-6 rounded-2xl border transition-all duration-300 ${
                    activeLayer === "layer-security" ? "border-red-500 shadow-lg shadow-red-500/5" : "border-white/10"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <span>🛡️</span> Security & Compliance Impact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Roles & Permissions</div>
                      {getCount(result.securityImpact?.permissions) === 0 && getCount(result.securityImpact?.roles) === 0 ? (
                        <div className="text-white/40 text-xs">No access changes</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.securityImpact?.roles?.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• Role: {item}</li>
                          ))}
                          {result.securityImpact?.permissions?.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• Permission: {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Compliance Concerns</div>
                      {getCount(result.securityImpact?.compliance) === 0 ? (
                        <div className="text-white/40 text-xs">No compliance issues detected</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.securityImpact?.compliance.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-red-400 font-medium">⚠️ {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Deployment Details */}
                <div
                  id="layer-deployment"
                  className={`bg-[#12184A] p-6 rounded-2xl border transition-all duration-300 ${
                    activeLayer === "layer-deployment" ? "border-cyan-500 shadow-lg shadow-cyan-500/5" : "border-white/10"
                  }`}
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                    <span>🚀</span> Deployment & Infrastructure Impact
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Infrastructure Elements</div>
                      {getCount(result.deploymentImpact?.infrastructure) === 0 ? (
                        <div className="text-white/40 text-xs">No infrastructure changes</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.deploymentImpact?.infrastructure.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-[#0D113D] p-4 rounded-xl border border-white/5">
                      <div className="text-white/40 text-xs font-semibold mb-2">Pipelines & CI/CD</div>
                      {getCount(result.deploymentImpact?.pipelines) === 0 ? (
                        <div className="text-white/40 text-xs">No pipeline changes</div>
                      ) : (
                        <ul className="space-y-1">
                          {result.deploymentImpact?.pipelines.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-white/80">• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}