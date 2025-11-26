import { useState, createContext, useEffect } from "react";
import logoBlack from "../assets/logo-black-small.png";
import logoWhite from "../assets/logo-white-small.png";
import avatar from "../assets/defaultAvatar.png";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";

import Button from "./Button";

type SidebarProps = {
  username: string;
  name: string;
  imgurl?: string;
  onLogout: () => void;
  children: React.ReactNode;
};

type SidebarContextValue = {
  expanded: boolean;
};

export const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined
);

function Sidebar({ username, name, imgurl, onLogout, children }: SidebarProps) {
  const [expanded, setExpanded] = useState<boolean>(() => {
    const stored = localStorage.getItem("sidebarExpanded");
    return stored ? JSON.parse(stored) : true; // default = expanded
  });
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const logo = isDark ? logoWhite : logoBlack;

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarExpanded", JSON.stringify(expanded));
  }, [expanded]);

  return (
    <aside className="sidebar h-screen text-start">
      <nav className="h-full flex flex-col">
        <div className="p-3 pb-2 flex w-full justify-between items-center mt-2 mb-4">
          <img
            src={logo}
            className={`overflow-hidden transition-all ${
              expanded ? "w-40" : "w-0"
            }`}
          />

          <Button
            size="sm"
            variant="transparent"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? <ChevronsLeft /> : <ChevronsRight />}
          </Button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">{children}</ul>
        </SidebarContext.Provider>

        <div className="flex pl-3 pr-2 py-6 items-center">
  <img
    className="w-12 h-12 rounded-full"
    src={imgurl || avatar}
    alt=""
  />

  <div
    className={`
      flex items-center overflow-hidden h-12 pr-1
      transition-[max-width,opacity,margin] duration-200
      ${expanded ? "max-w-xs w-full ml-3 opacity-100" : "max-w-0 ml-0 opacity-0"}
    `}
    aria-hidden={!expanded}
  >
    <div className="leading-4 w-full whitespace-nowrap">
      <h4 className="font-semibold text-lg text-(--text-color)">
        {username}
      </h4>
      <p className="text-(--menu-text-color)">{name}</p>
    </div>

    <Button variant="transparent" onClick={onLogout}>
      <LogOut size={24} />
    </Button>
  </div>
</div>
      </nav>
    </aside>
  );
}

export default Sidebar;
