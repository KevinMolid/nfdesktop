import { useState, useEffect } from "react"
import Task from "./Task";

const LOCAL_STORAGE_KEY = "tasks";
const FILTER_STORAGE_KEY = "visibleStatuses";

const ToDo = () => {
  type TaskData = {
        id: number;
        name: string;
        status: string;
    }
  
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

  // Load from localStorage once on mount
  useEffect(() => {
    const storedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTasks) {
      try {
        const parsed = JSON.parse(storedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      } catch (e) {
        console.error("Error parsing tasks from localStorage", e);
      }
    }

    const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (storedFilters) {
      try {
        const parsedFilters = JSON.parse(storedFilters);
        if (parsedFilters && typeof parsedFilters === "object") {
          setVisibleStatuses(parsedFilters);
        }
      } catch (e) {
        console.error("Error parsing filters from localStorage", e);
      }
    }
  }, []);

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
    const updatedTasks = [...tasks, {name: newTaskName, id: Date.now(), status: "active"}];
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
    clearNewTask()
  };

  const clearNewTask = () => {
    setIsCreateActive(false)
    setNewTaskName("")
  }

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
              {isFilterActive && <div className="filter-dropdown">
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
              <button onClick={addNewTask}>Opprett</button>
              <i className="fa-solid fa-cancel red red-hover icon-md hover" onClick={clearNewTask}></i>
            </div>
          </div>}

        {/* Tasklist */}
        {/* Active tasks */}
        {visibleStatuses.active && <ul className="task-list">
          {tasks.filter(task => task.status === "active").map((task, index) => (
            <Task 
              key={task.id}
              id={task.id} 
              name={task.name} 
              index={index}
              status={task.status}
              onDelete={() => deleteTask(task.id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </ul>}

        {/* Finished tasks */}
        {visibleStatuses.finished && <>
          <h4 className="card-title">Utførte oppgaver</h4>
          <ul className="task-list">
            {tasks.filter(task => task.status === "finished").map((task, index) => (
              <Task 
                key={task.id}
                id={task.id} 
                name={task.name} 
                index={index}
                status={task.status}
                onDelete={() => deleteTask(task.id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </>}

        {/* On-hold tasks */}
        {visibleStatuses.onhold && <>
          <h4 className="card-title">Pausede oppgaver</h4>
          <ul className="task-list">
            {tasks.filter(task => task.status === "onhold").map((task, index) => (
              <Task 
                key={task.id}
                id={task.id} 
                name={task.name} 
                index={index}
                status={task.status}
                onDelete={() => deleteTask(task.id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </>}

        {/* Cancelled tasks */}
        {visibleStatuses.cancelled && <>
          <h4 className="card-title">Kansellerte oppgaver</h4>
          <ul className="task-list">
            {tasks.filter(task => task.status === "cancelled").map((task, index) => (
              <Task 
                key={task.id}
                id={task.id} 
                name={task.name} 
                index={index}
                status={task.status}
                onDelete={() => deleteTask(task.id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </>}

    </div>
  )
}

export default ToDo