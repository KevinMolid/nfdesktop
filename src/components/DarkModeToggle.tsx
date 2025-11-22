import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button className="default-select" onClick={() => setDark(!dark)}>
      {dark ? (
        <>
          <div className="dropdown-item-icon-container">
            <i className="fa-solid fa-sun grey"></i>
          </div>
          <div className="dropdown-item-text-container">Set to Lightmode</div>
        </>
      ) : (
        <>
          <div className="dropdown-item-icon-container">
            <i className="fa-solid fa-moon grey"></i>
          </div>
          <div className="dropdown-item-text-container">Set to Darkmode</div>
        </>
      )}
    </button>
  );
}
