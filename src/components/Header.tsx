import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Burgermenu from "./Burgermenu";
import UserTag from "./UserTag";

import logoB from "../assets/logo-b.png";
import logoBW from "../assets/logo-bw.png";

type MenuProps = {
  username: string;
  widgets: { name: string; active: boolean }[];
  toggleActive: (name: string) => void;
  onLogout: () => void;
  onHeightChange: (height: number) => void;
};

const Header = ({ username, widgets, toggleActive, onLogout, onHeightChange }: MenuProps) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });
  const [showTopHeader, setShowTopHeader] = useState(false);

  const headerWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (headerWrapperRef.current) {
        onHeightChange(headerWrapperRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (headerWrapperRef.current) {
      observer.observe(headerWrapperRef.current);
    }

    return () => observer.disconnect();
  }, [onHeightChange]);

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
