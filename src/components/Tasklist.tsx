import { useState, useEffect, useRef } from "react"
import Task from "./Task";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const LOCAL_STORAGE_KEY = "tasks";
const FILTER_STORAGE_KEY = "visibleStatuses";

type ToDoProps = {
  userId: string;
};

type TaskData = {
      id: number;
      priority: number;
      name: string;
      status: string;
  }

const ToDo = ({ userId }: ToDoProps) => {
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [isCreateActive, setIsCreateActive] = useState(false)
  const [newTaskName, setNewTaskName] = useState("")
  const [tasks, setTasks] = useState<TaskData[]>([])

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

  // Load tasks (and migrate if needed)
  useEffect(() => {
    const loadTasks = async () => {
      const tasksRef = collection(db, "users", userId, "tasks");
      const snapshot = await getDocs(tasksRef);

      if (!snapshot.empty) {
        // Firestore has tasks
        const tasksFromDb = snapshot.docs.map((doc) => doc.data() as TaskData);
        setTasks(tasksFromDb);
      } else {
        // Try migrate from localStorage
        const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedTasks) {
          try {
            const parsed: TaskData[] = JSON.parse(storedTasks);
            if (Array.isArray(parsed)) {
              setTasks(parsed);
              // Write each to Firestore
              await Promise.all(
                parsed.map((task) =>
                  setDoc(
                    doc(db, "users", userId, "tasks", task.id.toString()),
                    task
                  )
                )
              );
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          } catch (e) {
            console.error("Error migrating tasks from localStorage:", e);
          }
        }
      }
    };

    loadTasks();
  }, [userId]);

  useEffect(() => {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(visibleStatuses));
    }, [visibleStatuses]);

  const toggleCreateActive = () => {
    setIsCreateActive(!isCreateActive)
  }

  const toggleFiltering = () => {
    setIsFilterActive(!isFilterActive)
  }

  const addNewTask = () => {
    const updatedTasks = [...tasks, {priority: 0, name: newTaskName, id: Date.now(), status: "active"}];
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
    clearNewTask()
  };

  const clearNewTask = () => {
    setIsCreateActive(false)
    setNewTaskName("")
  }

  const handleRename = (id: number, newName: string) => {
  const updatedTasks = tasks.map((task) =>
    task.id === id ? { ...task, name: newName } : task
  );
  setTasks(updatedTasks);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
};

  {/* Handle status change */}
  const handleStatusChange = (id: number, newStatus: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  const handlePriorityChange = (id: number, newPriority: number) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, priority: newPriority } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
  };

  const deleteTask = (id: number) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
  }

  return (
    <div className="card has-header grow-1">
        <div className="card-header">
            <h3 className="card-title">Oppgaver</h3>
            {!isCreateActive && <div className="icon-container">
              <i className="fa-solid fa-filter blue icon-md hover" onClick={toggleFiltering}></i>
              <i className="fa-solid fa-plus blue icon-md hover" onClick={toggleCreateActive}></i>
              {isFilterActive && <div className="filter-dropdown" ref={filterRef}>
                {["active", "finished", "onhold", "cancelled"].map((status) => (
                  <div
                    key={status}
                    className={`filter filter-${status} hover-border ${visibleStatuses[status] ? "active-selection" : ""}`}
                    onClick={() => {
                      setVisibleStatuses((prev) => ({
                        ...prev,
                        [status]: !prev[status],
                      }));
                    }}
                  >
                    {status === "active" && <i className="fa-solid fa-circle lightgrey"></i>}
                    {status === "finished" && <i className="fa-solid fa-check green"></i>}
                    {status === "onhold" && <i className="fa-solid fa-pause yellow"></i>}
                    {status === "cancelled" && <i className="fa-solid fa-xmark red"></i>}
                  </div>
                ))}
              </div>}
            </div>}
        </div>

        {isCreateActive && <div className="create-task-box">
            Opprett ny oppgave
            <div className="create-task-input-container">
              <input
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNewTask();
                  }
                }}
              />
              <div className="button-group">
                <button className="btn" onClick={addNewTask}>
                  <i className="fa-solid fa-check" ></i>
                  <p>Opprett</p>
                </button>
                <button onClick={clearNewTask}>
                  <p>Avbryt</p>
                  <i className="fa-solid fa-cancel red" ></i>
                </button>
              </div>
            </div>
          </div>}

        {/* Tasklist */}
        {/* Active tasks */}
        {visibleStatuses.active && <ul className="task-list">
          {tasks.filter(task => task.status === "active").sort((a, b) => {
              const order = [1, 2, 3, 0];
              return order.indexOf(a.priority) - order.indexOf(b.priority);
            }).map((task, index) => (
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
        </ul>}

        {/* Finished tasks */}
        {visibleStatuses.finished && <>
          <h4 className="card-title">Utførte oppgaver</h4>
          <ul className="task-list">
            {tasks.filter(task => task.status === "finished").sort((a, b) => {
                const order = [1, 2, 3, 0];
                return order.indexOf(a.priority) - order.indexOf(b.priority);
              }).map((task, index) => (
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
        </>}

        {/* On-hold tasks */}
        {visibleStatuses.onhold && <>
          <h4 className="card-title">Pausede oppgaver</h4>
          <ul className="task-list">
            {tasks.filter(task => task.status === "onhold").sort((a, b) => {
                const order = [1, 2, 3, 0];
                return order.indexOf(a.priority) - order.indexOf(b.priority);
              }).map((task, index) => (
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
        </>}

        {/* Cancelled tasks */}
        {visibleStatuses.cancelled && <>
          <h4 className="card-title">Kansellerte oppgaver</h4>
          <ul className="task-list">
            {tasks.filter(task => task.status === "cancelled").sort((a, b) => {
                const order = [1, 2, 3, 0];
                return order.indexOf(a.priority) - order.indexOf(b.priority);
              }).map((task, index) => (
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
        </>}

    </div>
  )
}

export default ToDo