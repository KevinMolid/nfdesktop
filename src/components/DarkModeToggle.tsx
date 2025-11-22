import { useEffect, useState } from "react";

import Button from "./Button";

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
    <Button
      variant="tertiary"
      onClick={() => setDark(!dark)}
      iconLeft={
        dark ? (
          <i className="fa-solid fa-sun"></i>
        ) : (
          <i className="fa-solid fa-moon"></i>
        )
      }
    >
      {dark ? <>Lightmode</> : <>Darkmode</>}
    </Button>
  );
}
