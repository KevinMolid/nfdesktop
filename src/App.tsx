import Header from "./components/Header";
import Login from "./components/Login";

import Message from "./components/Message";

import SafeWrapper from "./components/SafeWrapper";

/* Pages */
import Users from "./components/Users";
import Links from "./components/Links";
import Tasklist from "./components/Tasklist";
import Notes from "./components/Notes";
import Messages from "./components/Messages";
import NatoAlphabet from "./components/NatoAlphabet";
import Foodorders from "./components/Foodorders";
import FoodordersList from "./components/FoodordersList";

import Footer from "./components/Footer";
import "./App.css";

import { useState, useEffect, useRef, useLayoutEffect } from "react";

console.log("test");

const DEFAULT_WIDGETS = [
  { name: "Brukere", active: true },
  { name: "Lenker", active: true },
  { name: "Oppgaver", active: true },
  { name: "Notater", active: true },
  { name: "Meldinger", active: true },
  { name: "Nato-alfabet", active: false },
  { name: "Bestille Kebab", active: false },
];

const LOCAL_STORAGE_KEY = "widgets";

function App() {
  type User = {
    id: string;
    username: string;
    role: string;
  };

  const [user, setUser] = useState<User | null>(null);
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [message, setMessage] = useState("");

  useLayoutEffect(() => {
    if (!headerRef.current) return;

    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);

    window.addEventListener("resize", updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  useEffect(() => {
    // Load widgets from local storage and merge with default
    const storedWidgets = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedWidgets) {
      try {
        const parsed = JSON.parse(storedWidgets);
        if (Array.isArray(parsed)) {
          const merged = DEFAULT_WIDGETS.map((defaultWidget) => {
            const stored = parsed.find((w) => w.name === defaultWidget.name);
            return stored
              ? { ...defaultWidget, active: stored.active }
              : defaultWidget;
          });
          setWidgets(merged);
        }
      } catch (e) {
        console.error("Error parsing widgets from localStorage", e);
      }
    }

    // Load user
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
  };

  const toggleActive = (name: string) => {
    const updatedWidgets = widgets.map((w) => {
      if (w.name === name) {
        const newState = w.active ? false : true;
        return { ...w, active: newState };
      } else return w;
    });
    setWidgets(updatedWidgets);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWidgets));
  };

  return user ? (
    <>
      {/* Header absolutely positioned and measured with ref */}
      <div
        ref={headerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
        }}
      >
        <Header
          username={user.username}
          widgets={widgets}
          toggleActive={toggleActive}
          onLogout={handleLogout}
          onHeightChange={setHeaderHeight}
        />
      </div>

      {/* Main container pushed down by header height */}
      <div
        className="main-container"
        style={{ paddingTop: headerHeight - 15 || 120 }}
      >
        {message && <Message message={message} setMessage={setMessage} />}

        <SafeWrapper fallback={<div>Kunne ikke laste brukere</div>}>
          {widgets[0].active && <Users user={user} />}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste lenker</div>}>
          {widgets[1].active && <Links user={user} />}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste oppgaver</div>}>
          {widgets[2].active && <Tasklist user={user} />}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste notater</div>}>
          {widgets[3].active && <Notes user={user} />}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste meldinger</div>}>
          {widgets[4].active && <Messages username={user.username} />}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste Nato-alfabet</div>}>
          {widgets[5].active && <NatoAlphabet />}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke laste kebab-modulen</div>}>
          {widgets[6].active && (
            <Foodorders user={user} setMessage={setMessage} />
          )}
        </SafeWrapper>

        <SafeWrapper fallback={<div>Kunne ikke vise bestillinger</div>}>
          {widgets[6].active && <FoodordersList user={user} />}
        </SafeWrapper>

        <Footer />
      </div>
    </>
  ) : (
    <Login
      onLogin={(u) => {
        setUser(u);
        localStorage.setItem("authUser", JSON.stringify(u));
      }}
    />
  );
}

export default App;
