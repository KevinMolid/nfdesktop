import { useEffect, useState, useRef, useLayoutEffect } from "react";
import UserTag from "./UserTag";

import logo from "../assets/nflogo.png";

type MenuProps = {
  username: string;
  userImgUrl: string;
  widgets: { name: string; active: boolean }[];
  onLogout: () => void;
};

const Header = ({ username, userImgUrl, onLogout }: MenuProps) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });
  const [showTopHeader, setShowTopHeader] = useState(false);

  const headerWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerWrapperRef}>
      {showTopHeader && (
        <div className="top-header">
          <i className="fa-regular fa-comment"></i>
          <h2>Tilbakemeldinger?</h2>
          <button>Send her</button>
          <button
            className="close-button"
            onClick={() => setShowTopHeader(false)}
            aria-label="Lukk"
          >
            ✕
          </button>
        </div>
      )}
      <div className="bottom-header">
        <div className="menu-bar">
          <div className="logo">
            <a href="https://www.norronafly.com/" target="_blank">
              <img src={logo} alt="Norrønafly logo" className="nflogo" />
            </a>
          </div>
          <div className="menu-bar-right">
            <p className="username">{username}</p>
            <UserTag username={username} imgurl={userImgUrl} onLogout={onLogout} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
