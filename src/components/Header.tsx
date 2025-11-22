import { useEffect, useState, useRef } from "react";
import avatar from "../assets/defaultAvatar.png";

import { LogOut } from "lucide-react";

import logoBlack from "../assets/logo-black-small.png";
import logoWhite from "../assets/logo-white-small.png";

type MenuProps = {
  username: string;
  name: string;
  imgurl?: string;
  onLogout: () => void;
};

const Header = ({ username, name, imgurl, onLogout }: MenuProps) => {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const logo = isDark ? logoWhite : logoBlack;

  const [showTopHeader, setShowTopHeader] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const headerWrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Watch theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDark(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

          <div className="flex items-center gap-2">
            <div className="flex items-center overflow-hidden transition-all h-12 text-right">
              <div className="leading-4 w-full">
                <h4 className="font-semibold text-lg">{username}</h4>
                <p className="text-(--text3-color) text-nowrap">{name}</p>
              </div>
            </div>

            {/* User avatar + dropdown */}
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setShowUserMenu((prev) => !prev)}
              >
                <img
                  className="w-12 h-12 rounded-full"
                  src={imgurl || avatar}
                  alt=""
                />
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={onLogout}>
                    <div className="dropdown-item-icon-container">
                      <LogOut size={18} />
                    </div>
                    <div className="dropdown-item-text-container">Log out</div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
