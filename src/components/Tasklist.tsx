import { useState, useEffect, useRef } from "react"
import Task from "./Task";
import { db } from "./firebase";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";

const LOCAL_STORAGE_KEY = "tasks";
const FILTER_STORAGE_KEY = "visibleStatuses";
const TASKS_MOVED_KEY = "tasksMoved";

type User = {
  id: string;
  username: string;
  role: string;
};

type TasklistProps = {
  user: User;
};

type TaskData = {
  id: number;
  priority: number;
  name: string;
  status: string;
};

const ToDo = ({ user }: TasklistProps) => {
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [tasks, setTasks] = useState<TaskData[]>([]);

  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>(() => {
    const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (storedFilters) {
      try {
        const parsed = JSON.parse(storedFilters);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing filters from localStorage", e);
      }
    }
    return {
      active: true,
      finished: true,
      onhold: true,
      cancelled: true,
    };
  });

  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterActive(false);
      }
    };

    if (isFilterActive) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterActive]);

  useEffect(() => {
    const fetchTasks = async () => {
      const tasksMoved = localStorage.getItem(TASKS_MOVED_KEY);
      let localTasks: TaskData[] = [];

      if (!tasksMoved) {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              localTasks = parsed;
            }
          } catch (e) {
            console.error("Error parsing tasks from localStorage", e);
          }
        }
      }

      let dbTasks: TaskData[] = [];
      try {
        const snapshot = await getDocs(collection(db, "users", user.id, "tasks"));
        dbTasks = snapshot.docs.map(doc => doc.data() as TaskData);
      } catch (e) {
        console.warn("No DB tasks found or failed to fetch", e);
      }

      if (localTasks.length > 0 && !tasksMoved) {
        await Promise.all(
          localTasks.map(task =>
            setDoc(doc(db, "users", user.id, "tasks", task.id.toString()), task)
          )
        );
        localStorage.setItem(TASKS_MOVED_KEY, "true");
        setTasks([...dbTasks, ...localTasks]);
      } else {
        setTasks(dbTasks);
      }
    };

    fetchTasks();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(visibleStatuses));
  }, [visibleStatuses]);

  const toggleCreateActive = () => {
    setIsCreateActive(!isCreateActive);
  };

  const toggleFiltering = () => {
    setIsFilterActive(!isFilterActive);
  };

  const addNewTask = async () => {
    const newTask = {
      priority: 0,
      name: newTaskName,
      id: Date.now(),
      status: "active",
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskName("");
    setIsCreateActive(false);
    await setDoc(doc(db, "users", user.id, "tasks", newTask.id.toString()), newTask);
  };

  const handleRename = async (id: number, newName: string) => {
    const updatedTasks = tasks.map(task => task.id === id ? { ...task, name: newName } : task);
    setTasks(updatedTasks);
    await setDoc(doc(db, "users", user.id, "tasks", id.toString()), updatedTasks.find(t => t.id === id)!);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);
    await setDoc(doc(db, "users", user.id, "tasks", id.toString()), updatedTasks.find(t => t.id === id)!);
  };

  const handlePriorityChange = async (id: number, newPriority: number) => {
    const updatedTasks = tasks.map(task => task.id === id ? { ...task, priority: newPriority } : task);
    setTasks(updatedTasks);
    await setDoc(doc(db, "users", user.id, "tasks", id.toString()), updatedTasks.find(t => t.id === id)!);
  };

  const deleteTask = async (id: number) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    await deleteDoc(doc(db, "users", user.id, "tasks", id.toString()));
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Oppgaver</h3>
        {!isCreateActive && (
          <div className="icon-container">
            <i className="fa-solid fa-filter blue icon-md hover" onClick={toggleFiltering}></i>
            <i className="fa-solid fa-plus blue icon-md hover" onClick={toggleCreateActive}></i>
            {isFilterActive && (
              <div className="filter-dropdown" ref={filterRef}>
                {["active", "finished", "onhold", "cancelled"].map(status => (
                  <div
                    key={status}
                    className={`filter filter-${status} hover-border ${visibleStatuses[status] ? "active-selection" : ""}`}
                    onClick={() => setVisibleStatuses(prev => ({ ...prev, [status]: !prev[status] }))}
                  >
                    {status === "active" && <i className="fa-solid fa-circle lightgrey"></i>}
                    {status === "finished" && <i className="fa-solid fa-check green"></i>}
                    {status === "onhold" && <i className="fa-solid fa-pause yellow"></i>}
                    {status === "cancelled" && <i className="fa-solid fa-xmark red"></i>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isCreateActive && (
        <div className="create-task-box">
          Opprett ny oppgave
          <div className="create-task-input-container">
            <input
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") addNewTask();
              }}
            />
            <div className="button-group">
              <button className="btn" onClick={addNewTask}>
                <i className="fa-solid fa-check"></i>
                <p>Opprett</p>
              </button>
              <button onClick={() => setIsCreateActive(false)}>
                <p>Avbryt</p>
                <i className="fa-solid fa-cancel red"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {Object.entries(visibleStatuses).map(([status, visible]) => (
        visible && tasks.some(t => t.status === status) && (
          <div key={status}>
            {status !== "active" && <h4 className="card-title">{status === "finished" ? "Utførte" : status === "onhold" ? "Pausede" : "Kansellerte"} oppgaver</h4>}
            <ul className="task-list">
              {tasks
                .filter(t => t.status === status)
                .sort((a, b) => [1, 2, 3, 0].indexOf(a.priority) - [1, 2, 3, 0].indexOf(b.priority))
                .map((task, index) => (
                  <Task
                    key={task.id}
                    {...task}
                    index={index}
                    onDelete={() => deleteTask(task.id)}
                    onStatusChange={handleStatusChange}
                    onRename={handleRename}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
            </ul>
          </div>
        )
      ))}
    </div>
  );
};

export default ToDo;
