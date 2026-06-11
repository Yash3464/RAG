import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const userStr = localStorage.getItem("brained_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("brained_token");
    localStorage.removeItem("brained_user");
    window.location.href = "/";
  };

  const links = [
    {
      name: "Dashboard",
      path: "/",
      icon: "🏠",
    },
    ...(user?.role !== "admin"
      ? [
        {
          name: "Requirements",
          path: "/requirements",
          icon: "📋",
        },
      ]
      : []),
    {
      name: "Backlog",
      path: "/backlog",
      icon: "📅",
    },
    ...(user?.role !== "admin"
      ? [
        {
          name: "AI Resolution Center",
          path: "/resolution",
          icon: "⚡",
        },
      ]
      : []),
    {
      name: "Data Sources",
      path: "/sources",
      icon: "📂",
    },
  ];

  // Only show Admin Panel link if admin, Work Portal if employee
  if (user?.role === "admin") {
    links.push({
      name: "Documentation Log",
      path: "/admin",
      icon: "📝",
    });
  } else if (user?.role === "employee") {
    links.push({
      name: "Work Portal",
      path: "/work-portal",
      icon: "💼",
    });
  }

  return (
    <aside className="w-20 flex-shrink-0 min-h-screen relative transition-all duration-300">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed left-0 top-0 h-screen bg-[#070B42] border-r border-white/10 flex flex-col justify-between transition-all duration-300 z-[999] shadow-2xl ${
          isHovered ? "w-64" : "w-20"
        }`}
      >
        <div className="flex-grow flex flex-col overflow-y-auto custom-scrollbar">
          {/* Logo Header */}
          <div className="p-5 flex flex-col items-center xl:items-start min-h-[120px] justify-center transition-all duration-300">
            {isHovered ? (
              <div className="animate-fadeIn">
                <h1 className="text-3xl font-black text-[#FF4FA3] tracking-wide">
                  BRAINED
                </h1>
                <p className="text-white/40 text-[10px] mt-1 uppercase tracking-widest font-mono">
                  AI Product Intelligence
                </p>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7A39D8] to-[#E238A7] flex items-center justify-center font-black text-xl text-white shadow-lg animate-fadeIn">
                B
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-2 flex-grow">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-[#12184A] border border-[#FF4FA3]"
                      : "hover:bg-[#12184A]"
                  }`
                }
              >
                <span className="text-lg shrink-0" title={link.name}>{link.icon}</span>
                {isHovered && (
                  <span className="font-bold text-xs tracking-wide transition-opacity duration-300 whitespace-nowrap animate-fadeIn">
                    {link.name}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Section & Logout Button */}
        {user && (
          <div className="p-4 border-t border-white/10 bg-[#0A0D3C] space-y-4">
            {isHovered ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7A39D8] to-[#E238A7] flex items-center justify-center font-bold text-white shadow-md shrink-0">
                    {user.email.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate" title={user.email}>
                      {user.email}
                    </div>
                    <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${user.role === "admin" ? "bg-[#FF4FA3]/20 text-[#FF4FA3]" : "bg-cyan-500/20 text-cyan-400"
                      }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold text-xs border border-white/5 hover:border-white/10 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚪</span> Log Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7A39D8] to-[#E238A7] flex items-center justify-center font-bold text-white shadow-md cursor-help" title={`${user.email} (${user.role})`}>
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 hover:border-white/10 transition cursor-pointer flex items-center justify-center"
                  title="Log Out"
                >
                  <span>🚪</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}