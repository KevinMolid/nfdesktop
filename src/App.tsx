import Login from "./components/Login";
import Alert from "./components/Alert";

import SafeWrapper from "./components/SafeWrapper";

import {
  LayoutDashboard,
  Hammer,
  Hamburger,
  MessageCircle,
  Users,
  Settings,
} from "lucide-react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import SidebarItem from "./components/SidebarItem";
import MobileMenu from "./components/MobileMenu";
import MobileMenuItem from "./components/MobileMenuItem";
import Dashboard from "./components/Dashboard";

/* Pages */
import Messages from "./components/Messages";
import Tools from "./components/Tools";
import Foodorders from "./components/Foodorders";
import UsersList from "./components/Users";
import SettingsPage from "./components/Settings";

import { useAutoReloadOnVersion } from "./hooks/useAutoReloadOnVersion";
import { CURRENT_VERSION } from "./appVersion";

import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "./components/firebase";

import "./App.css";

import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

const DEFAULT_WIDGETS = [
  { name: "Links", active: true },
  { name: "Tasks", active: true },
  { name: "Notes", active: true },
];

const LOCAL_STORAGE_KEY = "widgets";

type ToastType = "success" | "error" | "info" | "warning" | "";
type Toast = { text: string; type: ToastType };
type ToastWithId = Toast & { id: string };

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="page-transition">{children}</div>
);

function App() {
  type User = {
    id: string;
    username: string;
    name?: string;
    role: string;
    imgurl?: string;
  };

  useAutoReloadOnVersion(CURRENT_VERSION);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [alerts, setAlerts] = useState<ToastWithId[]>([]);
  const location = useLocation();

  const pageToPath: Record<string, string> = {
    Dashboard: "/",
    Tools: "/tools",
    Chat: "/chat",
    Foodorders: "/foodorders",
    Users: "/users",
    Settings: "/settings",
  };

  // --- end React Router integration ---

  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        fetchUserFromDb(parsedUser.id)
          .then((freshUser) => {
            setUser(freshUser);
            localStorage.setItem("authUser", JSON.stringify(freshUser));
          })
          .catch(() => {
            // if user not found in db, clear local storage
            localStorage.removeItem("authUser");
            setUser(null);
          })
          .finally(() => setLoading(false));
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUserFromDb(id: string) {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    } else {
      throw new Error("User not found");
    }
  }

  useEffect(() => {
    if (!user?.id) return; // no user yet

    const ref = doc(db, "users", user.id);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const freshUser = { id: snap.id, ...(snap.data() as any) } as User;
          setUser(freshUser);
          localStorage.setItem("authUser", JSON.stringify(freshUser));
        } else {
          // user doc deleted
          setUser(null);
          localStorage.removeItem("authUser");
        }
      },
      (err) => {
        console.error("User onSnapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

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
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
  };

  const toggleActive = (name: string) => {
    const updatedWidgets = widgets.map((w) => {
      if (w.name === name) {
        const newState = !w.active;
        return { ...w, active: newState };
      } else return w;
    });
    setWidgets(updatedWidgets);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedWidgets));
  };

  const setAlertsAdapter: React.Dispatch<React.SetStateAction<Toast>> = (
    next
  ) => {
    const base: Toast =
      typeof next === "function"
        ? (next as (prev: Toast) => Toast)({ text: "", type: "" })
        : next;

    if (!base?.text) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setAlerts((prev) => [...prev, { ...base, id }]);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
          localStorage.setItem("authUser", JSON.stringify(u));
        }}
      />
    );
  }

  return (
    <>
      <Header
        username={user.username}
        name={user.name || user.username}
        imgurl={user.imgurl || ""}
        onLogout={handleLogout}
      />

      <MobileMenu>
        <MobileMenuItem icon={<LayoutDashboard />} text="Home" path="/" />
        <MobileMenuItem icon={<Hammer />} text="Tools" path="/tools" />
        <MobileMenuItem icon={<Hamburger />} text="Food" path="/foodorders" />
        <MobileMenuItem icon={<MessageCircle />} text="Chat" path="/chat" />
        <MobileMenuItem icon={<Users />} text="Users" path="/users" />
      </MobileMenu>

      <div className="screen">
        <Sidebar
          username={user.username}
          name={user.name || ""}
          imgurl={user.imgurl}
          onLogout={handleLogout}
        >
          <SidebarItem icon={<LayoutDashboard />} text="Dashboard" path="/" />
          <SidebarItem icon={<Hammer />} text="Tools" path="/tools" />
          <SidebarItem
            icon={<Hamburger />}
            text="Food orders"
            path="/foodorders"
          />
          <SidebarItem icon={<MessageCircle />} text="Chat" path="/chat" />
          <SidebarItem icon={<Users />} text="Users" path="/users" />
          <SidebarItem icon={<Settings />} text="Settings" path="/settings" />
        </Sidebar>

        <div className="main-container">
          <div className="alerts-stack">
            {alerts.map((a) => (
              <Alert
                key={a.id}
                alert={{ text: a.text, type: a.type }}
                onClose={() =>
                  setAlerts((prev) => prev.filter((x) => x.id !== a.id))
                }
              />
            ))}
          </div>

          <div key={location.pathname} className="page-transition">
            <Routes>
              <Route
                path="/"
                element={
                  <Page>
                    <Dashboard
                      user={user}
                      widgets={widgets}
                      toggleActive={toggleActive}
                    />
                  </Page>
                }
              />

              <Route
                path="/tools"
                element={
                  <Page>
                    <Tools toggleActive={toggleActive} />
                  </Page>
                }
              />

              <Route
                path="/chat"
                element={
                  <Page>
                    {" "}
                    <SafeWrapper
                      fallback={<div>Kunne ikke laste meldinger</div>}
                    >
                      <Messages
                        username={user.username}
                        toggleActive={toggleActive}
                      />
                    </SafeWrapper>
                  </Page>
                }
              />

              <Route
                path="/foodorders"
                element={
                  <Page>
                    <SafeWrapper
                      fallback={<div>Kunne ikke laste kebab-modulen</div>}
                    >
                      <Foodorders
                        user={user}
                        setAlerts={setAlertsAdapter}
                        toggleActive={toggleActive}
                      />
                    </SafeWrapper>
                  </Page>
                }
              />

              <Route
                path="/users"
                element={
                  <Page>
                    <UsersList user={user} toggleActive={toggleActive} />
                  </Page>
                }
              />

              <Route
                path="/settings"
                element={
                  <Page>
                    <SafeWrapper fallback={<div>Kunne ikke laste brukere</div>}>
                      <SettingsPage onLogout={handleLogout} user={user} />
                    </SafeWrapper>
                  </Page>
                }
              />

              {/* Fallback: any unknown route goes to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
