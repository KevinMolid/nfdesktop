import { useState, useRef, useEffect } from "react";
import Button from "./Button";

type MenuProps = {
  widgets: { name: string; active: boolean }[];
  toggleActive: (name: string) => void;
};

const Burgermenu = ({ widgets, toggleActive }: MenuProps) => {
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  const toggleMenuActive = () => {
    setIsActive(!isActive);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsActive(false);
      }
    };

    if (isActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActive]);

  const selectedWidgets = isDarkMode
    ? "bg-green-900 hover:bg-green-800"
    : "bg-green-200 hover:bg-green-300";

  return (
    <div ref={containerRef} className="burgermenu-container">
      <Button
        variant="transparent"
        size="sm"
        onClick={toggleMenuActive}
        iconLeft={<i className="fa-solid fa-eye"></i>}
      >
        Toggle widgets
      </Button>
      {isActive && (
        <div className="user-dropdown">
          <ul className="flex flex-col gap-1">
            {widgets.map((widget, index) =>
              widget.active ? (
                <li className="w-full"
                  key={"burger" + index}
                >
                  <button className={`burger-li w-full ${selectedWidgets} focus:outline-none
                    focus:outline-none focus:ring-2 focus:ring-offset-1
                    focus:ring-(--text-color)`}
                    onClick={() => toggleActive(widget.name)}>
                    <p>{widget.name}</p>
                    <i className="fa-solid fa-check"></i>
                  </button>
                </li>
              ) : (
                <li className="w-full"
                  key={"burger" + index}
                >
                  <button className={`burger-li hover:bg-(--bg4-color) text-(--text-color) w-full focus:outline-none
                    focus:outline-none focus:ring-2 focus:ring-offset-1
                    focus:ring-(--text-color)`}
                    onClick={() => toggleActive(widget.name)}>
                  <p>{widget.name}</p>
                  <i className="fa-solid fa-cancel"></i>
                  </button>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Burgermenu;
