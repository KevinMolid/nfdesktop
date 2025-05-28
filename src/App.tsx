import Header from "./components/Header"
import MenuBar from "./components/MenuBar"
import Login from "./components/Login"

/* Pages */
import Users from "./components/Users"
import Links from "./components/Links"
import logoB from "./assets/logo-b.png"
import Tasklist from "./components/Tasklist"
import Notes from "./components/Notes"
import Messages from "./components/Messages"
import Foodorders from "./components/Foodorders"

import Footer from "./components/Footer"
import './App.css'

import { useState, useEffect } from "react"

const DEFAULT_WIDGETS = [
  { name: "Brukere", active: true },
  { name: "Lenker", active: true },
  { name: "Oppgaver", active: true },
  { name: "Notater", active: true },
  { name: "Meldinger", active: true },
];

const LOCAL_STORAGE_KEY = "widgets";

function App() {
  type User = {
  username: string;
  role: string;
};

const [user, setUser] = useState<User | null>(null);
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);

  useEffect(() => {
    // Load widgets from local storage and merge with default
    const storedWidgets = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedWidgets) {
      try {
        const parsed = JSON.parse(storedWidgets);
        if (Array.isArray(parsed)) {
          const merged = DEFAULT_WIDGETS.map((defaultWidget) => {
            const stored = parsed.find((w) => w.name === defaultWidget.name);
            return stored ? { ...defaultWidget, active: stored.active } : defaultWidget;
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
    if (w.name === name){
      const newState = w.active ? false : true;
      return { ...w, active: newState}
    } else return w;
   })
   setWidgets(updatedWidgets)
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWidgets));
  }

  return user ? (
      <div className="main-container">
        <Header />
        <MenuBar username={user.username}
          widgets={widgets} 
          toggleActive={toggleActive} 
          onLogout={handleLogout}/>
        {widgets[0].active && <Users user={user}/>}
        {widgets[1].active && <Links/>}
        {widgets[2].active && <Tasklist />}
        {widgets[3].active && <Notes />}
        {widgets[4].active && <Messages username={user.username}/>}
        <Foodorders />
        <Footer />
      </div>
  ) : (
    <Login
      onLogin={(u) => {
        setUser(u);
        localStorage.setItem("authUser", JSON.stringify(u));
      }}
    />
  );
}

export default App
