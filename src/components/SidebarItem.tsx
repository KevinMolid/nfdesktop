import React, { useContext } from "react";
import { SidebarContext } from "./Sidebar";
import { useNavigate, useLocation } from "react-router-dom";

type SidebarItemProps = {
  icon: React.ReactNode;
  text: string;
  path: string;
  alert?: string;
};

function SidebarItem({ icon, text, path, alert }: SidebarItemProps) {
  const { expanded } = useContext(SidebarContext)!;
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 Determine active state automatically
  const isActive = location.pathname === path;

  return (
    <li>
      <button onClick={() => navigate(path)}
        className={`relative flex items-center py-2 px-3 my-1 
          font-medium rounded-md outline-none focus:ring-2
          focus:ring-offset-1 cursor-pointer transition-colors
          focus:ring-(--text-color)
        ${
          isActive
            ? "bg-(--bg3-color) text-(--text-color)"
            : "text-(--menu--color) hover:text-(--text-color) hover:bg-(--dash-bg-color)"
        }
      `}>
      {icon}

      <span
        className={`text-lg text-left whitespace-nowrap transition-all origin-left
          ${expanded ? "opacity-100 w-52 ml-3" : "opacity-0 w-0 ml-0"}
        `}
      >
        {text}
      </span>

      {alert && (
        <div className="absolute right-2 w-2 h-2 rounded bg-(--pri2-bg-color)"></div>
      )}
      </button>
    </li>
  );
}

export default SidebarItem;
