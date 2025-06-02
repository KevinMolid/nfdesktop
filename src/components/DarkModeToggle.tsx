import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div className="dropdown-item default-select hover-border" onClick={() => setDark(!dark)}>
      {dark ? <>
            <div className="dropdown-item-icon-container">
        <i className="m-l-1">🌙</i>
      </div>
      <div className="dropdown-item-text-container">
        Mørk
      </div></> : <>
            <div className="dropdown-item-icon-container">
        <i className="m-l-1">☀️</i>
      </div>
      <div className="dropdown-item-text-container">
        Lys
      </div></>}
    </div>
  );
}
