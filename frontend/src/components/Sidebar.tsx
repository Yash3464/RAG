import { NavLink } from "react-router-dom";

const links = [
  {
    name: "Dashboard",
    path: "/",
  },
  {
    name: "Requirements",
    path: "/requirements",
  },
  {
    name: "Backlog",
    path: "/backlog",
  },
  {
    name: "AI Resolution Center",
    path: "/resolution",
  },
  {
    name: "Impact Analysis",
    path: "/impact",
  },
  {
    name: "Data Sources",
    path: "/sources",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#070B42] border-r border-white/10 min-h-screen">
      <div className="p-8">
        <h1 className="text-4xl font-black text-[#FF4FA3]">
          BRAINED
        </h1>

        <p className="text-white/50 mt-2">
          AI Product Intelligence
        </p>
      </div>

      <nav className="px-4 space-y-2">
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
              ${
                isActive
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
    </aside>
  );
}