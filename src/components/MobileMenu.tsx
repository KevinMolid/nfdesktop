type MenuProps = {
  activePage: string;
  setActivePage: (page: string) => void;
};

const MobileMenu = ({
  activePage,
  setActivePage,
}: MenuProps) => {
  return (
    <ul className="mobile-menu">
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
        <i className="fa-solid fa-users"></i>
      </li>
      <li
        className={activePage === "Settings" ? "active" : ""}
        onClick={() => setActivePage("Settings")}
      >
        <i className="fa-solid fa-gear"></i>
      </li>
    </ul>
  );
};

export default MobileMenu;
