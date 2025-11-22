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
    <li
      onClick={() => navigate(path)}
      className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors
        ${
          isActive
            ? "bg-(--bg3-color) text-(--brand3-color)"
            : "text-(--text3-color) hover:text-(--text-color) hover:bg-(--dash-bg-color)"
        }
      `}
    >
      {icon}

      <span
        className={`text-lg whitespace-nowrap transition-all origin-left
          ${expanded ? "opacity-100 w-52 ml-3" : "opacity-0 w-0 ml-0"}
        `}
      >
        {text}
      </span>

      {alert && (
        <div className="absolute right-2 w-2 h-2 rounded bg-(--pri2-bg-color)"></div>
      )}
    </li>
  );
}

export default SidebarItem;
