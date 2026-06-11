import { NavLink } from "react-router-dom";

export default function Sidebar() {
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
    },
    ...(user?.role !== "admin"
      ? [
        {
          name: "Requirements",
          path: "/requirements",
        },
      ]
      : []),
    {
      name: "Backlog",
      path: "/backlog",
    },
    ...(user?.role !== "admin"
      ? [
        {
          name: "AI Resolution Center",
          path: "/resolution",
        },
      ]
      : []),
    {
      name: "Data Sources",
      path: "/sources",
    },
  ];

  // Only show Admin Panel link if admin, Work Portal if employee
  if (user?.role === "admin") {
    links.push({
      name: "Documentation Log",
      path: "/admin",
    });
  } else if (user?.role === "employee") {
    links.push({
      name: "Work Portal",
      path: "/work-portal",
    });
  }

  return (
    <aside className="w-64 bg-[#070B42] border-r border-white/10 min-h-screen flex flex-col justify-between">
      <div className="flex-grow flex flex-col">
        <div className="p-8">
          <h1 className="text-4xl font-black text-[#FF4FA3]">
            BRAINED
          </h1>

          <p className="text-white/50 mt-2">
            AI Product Intelligence
          </p>
        </div>

        <nav className="px-4 space-y-2 flex-grow">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `
                block
                px-4
                py-3
                rounded-xl
                transition
                ${isActive
                  ? "bg-[#12184A] border border-[#FF4FA3]"
                  : "hover:bg-[#12184A]"
                }
                `
              }
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Section & Logout Button */}
      {user && (
        <div className="p-6 border-t border-white/10 bg-[#0A0D3C] space-y-4">
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
      )}
    </aside>
  );
}