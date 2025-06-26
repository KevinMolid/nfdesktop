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

  useEffect(() => {
    const loadTasks = async () => {
      const tasksRef = collection(db, "users", userId, "tasks");

      // 1. Load existing tasks from Firestore
      const snapshot = await getDocs(tasksRef);
      const tasksFromDb: TaskData[] = snapshot.docs.map((doc) => doc.data() as TaskData);

      // 2. Check if localStorage has additional tasks
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localTasks: TaskData[] = [];

      if (storedTasks) {
        try {
          const parsed = JSON.parse(storedTasks);
          if (Array.isArray(parsed)) {
            localTasks = parsed;
          }
        } catch (e) {
          console.error("Error parsing localStorage tasks:", e);
        }
      }

      // 3. Merge localStorage tasks that aren't already in Firestore
      const dbTaskIds = new Set(tasksFromDb.map(task => task.id));
      const tasksToAdd = localTasks.filter(task => !dbTaskIds.has(task.id));
      const mergedTasks = [...tasksFromDb, ...tasksToAdd];

      // 4. Save new ones to Firestore
      if (tasksToAdd.length > 0) {
        await Promise.all(
          tasksToAdd.map(task =>
            setDoc(doc(db, "users", userId, "tasks", task.id.toString()), task)
          )
        );
      }

      // ✅ Always remove local storage if it had tasks
      if (localTasks.length > 0) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      // 5. Set merged state
      setTasks(mergedTasks);
    };

    loadTasks();
  }, [userId]);


  useEffect(() => {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(visibleStatuses));
    }, [visibleStatuses]);

  const saveTasks = async (updatedTasks: TaskData[]) => {
    setTasks(updatedTasks);
    await Promise.all(
      updatedTasks.map((task) =>
        setDoc(doc(db, "users", userId, "tasks", task.id.toString()), task)
      )
    );
  };

  const toggleCreateActive = () => {
    setIsCreateActive(!isCreateActive)
  }

  const toggleFiltering = () => {
    setIsFilterActive(!isFilterActive)
  }

  const addNewTask = async () => {
    const newTask: TaskData = {
      priority: 0,
      name: newTaskName,
      id: Date.now(),
      status: "active",
    };
    const updated = [...tasks, newTask];
    await saveTasks(updated);
    clearNewTask();
  };

  const clearNewTask = () => {
    setIsCreateActive(false)
    setNewTaskName("")
  }

  const handleRename = async (id: number, newName: string) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, name: newName } : task
    );
    await saveTasks(updated);
  };

  {/* Handle status change */}
  const handleStatusChange = async (id: number, newStatus: string) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, status: newStatus } : task
    );
    await saveTasks(updated);
  };

  const handlePriorityChange = async (id: number, newPriority: number) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, priority: newPriority } : task
    );
    await saveTasks(updated);
  };

  const deleteTask = async (id: number) => {
    const updated = tasks.filter((task) => task.id !== id);
    setTasks(updated);
    await deleteDoc(doc(db, "users", userId, "tasks", id.toString()));
  };

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