import { useState, createContext, useEffect } from "react";
import logoBlack from "../assets/logo-black-small.png";
import logoWhite from "../assets/logo-white-small.png";
import avatar from "../assets/defaultAvatar.png";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";

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

function SidebarNew({
  username,
  name,
  imgurl,
  onLogout,
  children,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<boolean>(() => {
    const stored = localStorage.getItem("sidebarExpanded");
    return stored ? JSON.parse(stored) : true; // default = expanded
  });
  const isDarkMode =
    document.documentElement.getAttribute("data-theme") === "dark";
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
    <aside className="sidebar h-screen text-start text-(--text1-color)">
      <nav className="h-full flex flex-col shadow-sm bg-(--main-bg-color)">
        <div className="p-3 pb-2 flex w-full justify-between items-center mt-2 mb-4">
          <img
            src={logo}
            className={`overflow-hidden transition-all ${
              expanded ? "w-40" : "w-0"
            }`}
          />

          <button
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: "var(--button-bg)" }}
            onClick={() => setExpanded((prev) => !prev)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--button-hover-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--button-bg)";
            }}
          >
            {expanded ? <ChevronsLeft /> : <ChevronsRight />}
          </button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">{children}</ul>
        </SidebarContext.Provider>

        <div className="flex px-3 py-6">
          <img
            className="w-12 h-12 rounded-full"
            src={imgurl || avatar}
            alt=""
          />

          <div
            className={`flex items-center overflow-hidden transition-all h-12 ${
              expanded ? "w-52 ml-3" : "w-0"
            }`}
          >
            <div className="leading-4 w-full">
              <h4 className="font-semibold text-lg">{username}</h4>
              <p className="text-(--text3-color) text-nowrap">{name}</p>
            </div>
            <button onClick={onLogout}>
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}

export default SidebarNew;
