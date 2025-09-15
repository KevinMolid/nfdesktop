import logo from "../assets/nflogo.png";
import UserTag from "./UserTag";
import { CURRENT_VERSION } from "../appVersion";

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
  return (
    <div className="sidebar">
      <div className="logo">
        <a href="https://www.norronafly.com/" target="_blank">
          <img src={logo} alt="Norrønafly logo" className="nflogo" />
        </a>
        <small>v{CURRENT_VERSION}</small>
      </div>
      <ul className="sidebar-menu">
        <li
          className={activePage === "Dashboard" ? "active" : ""}
          onClick={() => setActivePage("Dashboard")}
        >
          <i className="fa-solid fa-desktop"></i>
        </li>
        <li
          className={activePage === "Tools" ? "active" : ""}
          onClick={() => setActivePage("Tools")}
        >
          <i className="fa-solid fa-screwdriver-wrench"></i>
        </li>
        <li
          className={activePage === "Chat" ? "active" : ""}
          onClick={() => setActivePage("Chat")}
        >
          <i className="fa-solid fa-message"></i>
        </li>
        <li
          className={activePage === "Foodorders" ? "active" : ""}
          onClick={() => setActivePage("Foodorders")}
        >
          <i className="fa-solid fa-burger"></i>
        </li>
        <li
          className={activePage === "Users" ? "active" : ""}
          onClick={() => setActivePage("Users")}
        >
          <i className="fa-solid fa-users"></i>{" "}
        </li>
        <li
          className={activePage === "Settings" ? "active" : ""}
          onClick={() => setActivePage("Settings")}
        >
          <i className="fa-solid fa-gear"></i>
        </li>
      </ul>
      <div className="menu-bar-right">
        <UserTag username={username} imgurl={imgurl} onLogout={onLogout} />
      </div>
    </div>
  );
};

export default Sidebar;
