import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

type MobileMenuItemProps = {
  icon: React.ReactNode;
  text: string;
  path: string;
  alert?: string;
};

function MobileMenuItem({ icon, text, path, alert }: MobileMenuItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === path;

  return (
    <li
      onClick={() => navigate(path)}
      className={`
        relative
        flex flex-col items-center justify-center
        py-1 px-2
        font-medium
        rounded-md
        cursor-pointer
        transition-colors
        ${
          isActive
            ? "bg-(--bg3-color) text-(--text-color)"
            : "text-(--text3-color) hover:text-(--text-color) hover:bg-(--dash-bg-color)"
        }
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">{icon}</div>

      {/* Text under icon */}
      <span className="text-sm mt-1 leading-none">{text}</span>

      {alert && (
        <div className="absolute right-1 top-1 w-2 h-2 rounded bg-(--pri2-bg-color)"></div>
      )}
    </li>
  );
}

export default MobileMenuItem;
