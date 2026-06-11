import { useState } from "react";
import { api } from "../services/api";

interface LoginProps {
  onLoginSuccess: (user: { email: string; role: "admin" | "employee" }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customCreds?: { email: string; password: string }) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customCreds ? customCreds.email : email;
    const loginPassword = customCreds ? customCreds.password : password;

    try {
      const response = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      if (response.data.success) {
        localStorage.setItem("brained_token", response.data.token);
        localStorage.setItem("brained_user", JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: "admin" | "employee") => {
    const creds =
      role === "admin"
        ? { email: "admin@brained.ai", password: "admin123" }
        : { email: "employee@brained.ai", password: "employee123" };
    
    setEmail(creds.email);
    setPassword(creds.password);
    handleLogin(undefined, creds);
  };

  return (
    <div className="fixed inset-0 bg-[#070926] flex justify-center items-center overflow-y-auto px-4 z-[9999]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7A39D8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF4FA3]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[#12184A]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Glow overlay */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF4FA3]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[#FF4FA3] tracking-wide">
            BRAINED
          </h1>
          <p className="text-white/40 mt-1.5 text-sm uppercase tracking-widest font-mono">
            Product Intelligence Log In
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 mb-6 animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 font-mono">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0D113D] rounded-xl px-4 py-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-sm placeholder-white/20 font-medium"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs font-semibold mb-1.5 font-mono">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0D113D] rounded-xl px-4 py-3 text-white border border-white/10 focus:border-[#FF4FA3]/50 focus:outline-none text-sm placeholder-•••••••• font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7A39D8] via-[#B637BF] to-[#E238A7] hover:opacity-95 disabled:opacity-40 text-white font-bold tracking-wide transition shadow-lg shadow-pink-500/10 cursor-pointer text-sm"
          >
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-white/30 text-[10px] uppercase font-bold tracking-wider font-mono">
            Or Quick Login (For Review)
          </span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleQuickLogin("admin")}
            disabled={loading}
            className="py-3 rounded-xl bg-[#0D113D] hover:bg-[#12184A] border border-[#FF4FA3]/20 hover:border-[#FF4FA3]/60 text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <span>👑</span>
            <span>Admin Workspace</span>
          </button>
          <button
            onClick={() => handleQuickLogin("employee")}
            disabled={loading}
            className="py-3 rounded-xl bg-[#0D113D] hover:bg-[#12184A] border border-cyan-500/20 hover:border-cyan-500/60 text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <span>👥</span>
            <span>Employee Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}
