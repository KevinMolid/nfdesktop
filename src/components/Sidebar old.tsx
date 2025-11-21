import logo from "../assets/nflogo.png";
import UserTag from "./UserTag";
import { CURRENT_VERSION } from "../appVersion";

import { useState } from "react";

type SidebarProps = {
  username: string;
  imgurl?: string;
  onLogout: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
};

const Sidebar = ({
  username,
  imgurl,
  onLogout,
  activePage,
  setActivePage,
}: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  return (
    <div className={`sidebar ${isExpanded ? "sidebar-expanded" : ""}`}>
      <div className="logo">
        <a href="https://www.norronafly.com/" target="_blank">
          <img src={logo} alt="Norrønafly logo" className="nflogo" />
        </a>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <i className="fa-solid fa-angle-left"></i>
          : <i className="fa-solid fa-angle-right"></i>}
        </button>
      </div>
      <ul className="sidebar-menu">
        <li
          className={activePage === "Dashboard" ? "active" : ""}
          onClick={() => setActivePage("Dashboard")}
        >
          <i className="fa-solid fa-desktop"></i>
          {isExpanded && <p>Dashboard</p>}
        </li>
        <li
          className={activePage === "Tools" ? "active" : ""}
          onClick={() => setActivePage("Tools")}
        >
          <i className="fa-solid fa-screwdriver-wrench"></i>
          {isExpanded && <p>Tools</p>}
        </li>
        <li
          className={activePage === "Chat" ? "active" : ""}
          onClick={() => setActivePage("Chat")}
        >
          <i className="fa-solid fa-message"></i>
          {isExpanded && <p>Chat</p>}
        </li>
        <li
          className={activePage === "Foodorders" ? "active" : ""}
          onClick={() => setActivePage("Foodorders")}
        >
          <i className="fa-solid fa-burger"></i>
          {isExpanded && <p>Food</p>}
        </li>
        <li
          className={activePage === "Users" ? "active" : ""}
          onClick={() => setActivePage("Users")}
        >
          <i className="fa-solid fa-users"></i>{" "}
          {isExpanded && <p>Users</p>}
        </li>
        <li
          className={activePage === "Settings" ? "active" : ""}
          onClick={() => setActivePage("Settings")}
        >
          <i className="fa-solid fa-gear"></i>
          {isExpanded && <p>Settings</p>}
        </li>
      </ul>
      <div className="menu-bar-right">
        <UserTag username={username} imgurl={imgurl} onLogout={onLogout} />
      </div>
    </div>
  );
};

export default Sidebar;
