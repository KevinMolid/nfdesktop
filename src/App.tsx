import MenuBar from "./components/MenuBar"
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

    // Load from localStorage once on mount
    useEffect(() => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setWidgets(parsed);
          }
        } catch (e) {
          console.error("Error parsing localStorage", e);
        }
      }
    }, []);

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

  return (
    <>
      <div className="main-container">
        <div className='logo'>
          <a href="https://www.norronafly.com/" target="_blank">
            <img src={logoB} alt="Norrønafly logo" className='nflogo'/>
          </a>
        </div>

        <MenuBar widgets={widgets} toggleActive={toggleActive}/>
        {widgets[0].active && <Links/>}
        {widgets[1].active && <Tasklist />}
        {widgets[2].active && <Notes />}
        {widgets[3].active && <Messages />}
        <Footer />
      </div>
    </>
  )
}

export default App
