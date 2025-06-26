import { useState, useEffect, useRef } from "react"
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Task from "./Task";

const LOCAL_STORAGE_KEY = "tasks";
const FILTER_STORAGE_KEY = "visibleStatuses";

type TaskData = {
  id: number;
  priority: number;
  name: string;
  status: string;
};

type User = {
  id: string;
  username: string;
  name: string;
  nickname: string;
  role: string;
};

type Props = {
  user: User;
};

const ToDo = ({ user }: Props) => {
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [tasks, setTasks] = useState<TaskData[]>([]);

  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
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
    const syncAndLoadTasks = async () => {
      const db = getFirestore();
      const userTasksRef = collection(db, "users", user.id, "tasks");

      // 1. Load localStorage tasks
      const localTasks: TaskData[] = [];
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((t: any) => localTasks.push(t));
          }
        } catch (e) {
          console.error("Failed to parse localStorage tasks", e);
        }
      }

      // 2. Load DB tasks
      let dbTasks: TaskData[] = [];
      const snapshot = await getDocs(userTasksRef);
      const dbTaskIDs = new Set<string>();
      snapshot.forEach((doc) => {
        dbTaskIDs.add(doc.id);
        const data = doc.data();
        dbTasks.push({
          id: Number(doc.id),
          name: data.name,
          priority: data.priority,
          status: data.status,
        });
      });

      // 3. Upload all local tasks to DB
      for (const task of localTasks) {
        const idStr = String(task.id);
        await setDoc(doc(userTasksRef, idStr), {
          id: task.id,
          name: task.name,
          priority: task.priority,
          status: task.status,
        });
      }

      // 4. Clear localStorage after successful upload
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      setTasks(dbTasks); // Only DB tasks shown
    };

    syncAndLoadTasks();
  }, [user.id]);

  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(visibleStatuses));
  }, [visibleStatuses]);

  const toggleCreateActive = () => setIsCreateActive(!isCreateActive);
  const toggleFiltering = () => setIsFilterActive(!isFilterActive);

  const addNewTask = async () => {
    const db = getFirestore();
    const newTask: TaskData = {
      id: Date.now(),
      name: newTaskName,
      priority: 0,
      status: "active",
    };
    await setDoc(doc(db, "users", user.id, "tasks", String(newTask.id)), {
      name: newTask.name,
      priority: newTask.priority,
      status: newTask.status,
    });
    setTasks((prev) => [...prev, newTask]);
    clearNewTask();
  };

  const clearNewTask = () => {
    setIsCreateActive(false);
    setNewTaskName("");
  };

  const handleRename = async (id: number, newName: string) => {
    const db = getFirestore();
    const taskRef = doc(db, "users", user.id, "tasks", String(id));
    await updateDoc(taskRef, { name: newName });
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, name: newName } : task))
    );
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const db = getFirestore();
    const taskRef = doc(db, "users", user.id, "tasks", String(id));
    await updateDoc(taskRef, { status: newStatus });
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status: newStatus } : task))
    );
  };

  const handlePriorityChange = async (id: number, newPriority: number) => {
    const db = getFirestore();
    const taskRef = doc(db, "users", user.id, "tasks", String(id));
    await updateDoc(taskRef, { priority: newPriority });
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, priority: newPriority } : task))
    );
  };

  const deleteTask = async (id: number) => {
    const db = getFirestore();
    await deleteDoc(doc(db, "users", user.id, "tasks", String(id)));
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const sortTasks = (a: TaskData, b: TaskData) => {
    const order = [1, 2, 3, 0];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
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
                {["active", "finished", "onhold", "cancelled"].map((status) => (
                  <div
                    key={status}
                    className={`filter filter-${status} hover-border ${
                      visibleStatuses[status] ? "active-selection" : ""
                    }`}
                    onClick={() =>
                      setVisibleStatuses((prev) => ({
                        ...prev,
                        [status]: !prev[status],
                      }))
                    }
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
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addNewTask();
              }}
            />
            <div className="button-group">
              <button className="btn" onClick={addNewTask}>
                <i className="fa-solid fa-check"></i>
                <p>Opprett</p>
              </button>
              <button onClick={clearNewTask}>
                <p>Avbryt</p>
                <i className="fa-solid fa-cancel red"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {["active", "finished", "onhold", "cancelled"].map((statusKey) =>
        visibleStatuses[statusKey] ? (
          <div key={statusKey}>
            {statusKey !== "active" && (
              <h4 className="card-title">
                {statusKey === "finished"
                  ? "Utførte oppgaver"
                  : statusKey === "onhold"
                  ? "Pausede oppgaver"
                  : "Kansellerte oppgaver"}
              </h4>
            )}
            <ul className="task-list">
              {tasks
                .filter((task) => task.status === statusKey)
                .sort(sortTasks)
                .map((task, index) => (
                  <Task
                    key={task.id}
                    id={task.id}
                    priority={task.priority}
                    name={task.name}
                    index={index}
                    status={task.status}
                    onDelete={() => deleteTask(task.id)}
                    onStatusChange={handleStatusChange}
                    onRename={handleRename}
                    onPriorityChange={handlePriorityChange}
                  />
                ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
};

export default ToDo;
