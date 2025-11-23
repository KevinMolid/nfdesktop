import { useEffect, useState, useRef } from "react";
import avatar from "../assets/defaultAvatar.png";

import { LogOut, Settings } from "lucide-react";
import Button from "./Button";

import logo from "../assets/logo-white-small-notext.png";

import { useNavigate } from "react-router-dom";

type MenuProps = {
  username: string;
  name: string;
  imgurl?: string;
  onLogout: () => void;
};

const Header = ({ username, name, imgurl, onLogout }: MenuProps) => {
  const [showTopHeader, setShowTopHeader] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const headerWrapperRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

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
            <img src={logo} alt="Norrønafly logo" className="nflogo" />
          </div>

          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-(--bg2-color) pl-4 rounded-lg"
            ref={userMenuRef}
            onClick={() => setShowUserMenu((prev) => !prev)}
          >
            <div className="flex items-center overflow-hidden transition-all h-12 text-right">
              <div className="leading-4 w-full">
                <h4 className="user">{username}</h4>
                <p className="text-sm text-nowrap">{name}</p>
              </div>
            </div>

            {/* User avatar + dropdown */}
            <div className="user-menu">
              <img
                className="w-10 h-10 rounded-full"
                src={imgurl || avatar}
                alt=""
              />

              {showUserMenu && (
                <div className="user-dropdown flex gap-1 flex-col">
                  <Button
                    variant="tertiary"
                    onClick={() => navigate("/settings")}
                    iconLeft={<Settings size={18} />}
                  >
                    <div className="dropdown-item-text-container">Settings</div>
                  </Button>
                  <Button
                    variant="tertiary"
                    onClick={onLogout}
                    iconLeft={<LogOut size={18} />}
                  >
                    <div className="dropdown-item-text-container">Log out</div>
                  </Button>
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
