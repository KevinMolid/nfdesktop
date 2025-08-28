import Login from "./components/Login";
import Message from "./components/Message";

import SafeWrapper from "./components/SafeWrapper";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MobileMenu from "./components/MobileMenu";
import Dashboard from "./components/Dashboard";

/* Pages */
import Messages from "./components/Messages";
import NatoAlphabet from "./components/NatoAlphabet";
import Foodorders from "./components/Foodorders";
import Users from "./components/Users";

import "./App.css";

import { useState, useEffect } from "react";

const DEFAULT_WIDGETS = [
  { name: "Links", active: true },
  { name: "Tasks", active: true },
  { name: "Notes", active: true },
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
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "info" | "warning" | "";
  }>({
    text: "",
    type: "",
  });
  const [activePage, setActivePage] = useState(
    () => localStorage.getItem("activePage") || "Dashboard"
  );

  useEffect(() => {
    localStorage.setItem("activePage", activePage);
  }, [activePage]);

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
      <Header
        username={user.username}
        onLogout={handleLogout}
        widgets={widgets}
        toggleActive={toggleActive}
      />

      <MobileMenu
        username={user.username}
        onLogout={handleLogout}
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="screen">
        <Sidebar
          username={user.username}
          onLogout={handleLogout}
          activePage={activePage}
          setActivePage={setActivePage}
        />

        <div className="main-container">
          {message.text && (
            <Message message={message} setMessage={setMessage} />
          )}

          {activePage === "Dashboard" && (
            <Dashboard
              user={user}
              widgets={widgets}
              toggleActive={toggleActive}
            />
          )}

          {activePage === "Tools" && (
            <>
              <SafeWrapper fallback={<div>Kunne ikke laste Nato-alfabet</div>}>
                <NatoAlphabet toggleActive={toggleActive} />
              </SafeWrapper>
            </>
          )}

          {activePage === "Chat" && (
            <SafeWrapper fallback={<div>Kunne ikke laste meldinger</div>}>
              <Messages username={user.username} toggleActive={toggleActive} />
            </SafeWrapper>
          )}

          {activePage === "Foodorders" && (
            <>
              <SafeWrapper fallback={<div>Kunne ikke laste kebab-modulen</div>}>
                <Foodorders
                  user={user}
                  setMessage={setMessage}
                  toggleActive={toggleActive}
                />
              </SafeWrapper>
            </>
          )}

          {activePage === "Settings" && (
            <SafeWrapper fallback={<div>Kunne ikke laste brukere</div>}>
              <Users user={user} toggleActive={toggleActive} />
            </SafeWrapper>
          )}
        </div>
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
