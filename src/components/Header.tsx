import { useEffect, useState } from "react";
import Burgermenu from "./Burgermenu";
import UserTag from "./UserTag";

import logoB from "../assets/logo-b.png";
import logoBW from "../assets/logo-bw.png";

type MenuProps = {
  username: string;
  widgets: { name: string; active: boolean }[];
  toggleActive: (name: string) => void;
  onLogout: () => void;
};

const Header = ({ username, widgets, toggleActive, onLogout }: MenuProps) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header>
      <div className="top-header">
        <i className="fa-regular fa-comment"></i>
        <h2>Tilbakemeldinger?</h2>
        <button>Send her</button>
      </div>
      <div className="bottom-header">
        <div className="menu-bar">
          <div className="menu-bar-left">
            <Burgermenu widgets={widgets} toggleActive={toggleActive} />
          </div>
          <div className="logo">
            <a href="https://www.norronafly.com/" target="_blank">
              <img
                src={isDarkMode ? logoBW : logoB}
                alt="Norrønafly logo"
                className="nflogo"
              />
            </a>
          </div>
          <div className="menu-bar-right">
            <UserTag username={username} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
