import MenuBar from "./components/MenuBar"
import Login from "./components/Login"
import Users from "./components/Users"
import Links from "./components/Links"
import logoB from "./assets/logo-b.png"
import Tasklist from "./components/Tasklist"
import Notes from "./components/Notes"
import Messages from "./components/Messages"
import Footer from "./components/Footer"
import './App.css'

import { useState, useEffect } from "react"

const LOCAL_STORAGE_KEY = "widgets";

function App() {
  type User = {
  username: string;
  role: string;
};

const [user, setUser] = useState<User | null>(null);
  const [widgets, setWidgets] = useState([
    {name: "Lenker",
      active: true},
    {name: "Oppgaver",
      active: true},
    {name: "Notater",
      active: true},
    {name: "Meldinger",
      active: false},
  ])

  useEffect(() => {
    // Load widgets
    const storedWidgets = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedWidgets) {
      try {
        const parsed = JSON.parse(storedWidgets);
        if (Array.isArray(parsed)) {
          setWidgets(parsed);
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
        <div className='logo'>
          <a href="https://www.norronafly.com/" target="_blank">
            <img src={logoB} alt="Norrønafly logo" className='nflogo'/>
          </a>
        </div>

        <MenuBar username={user.username}
          widgets={widgets} 
          toggleActive={toggleActive} 
          onLogout={handleLogout}/>
        <Users />
        {widgets[0].active && <Links/>}
        {widgets[1].active && <Tasklist />}
        {widgets[2].active && <Notes />}
        {widgets[3].active && <Messages />}
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
