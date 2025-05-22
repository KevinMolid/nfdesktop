import { useState, useEffect } from "react"
import Task from "./Task";

const LOCAL_STORAGE_KEY = "tasks";

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

  // Load from localStorage once on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      } catch (e) {
        console.error("Error parsing localStorage", e);
      }
    }
  }, []);

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
  const handleStatusChange = (id: number) => {
    const updatedTasks = tasks.map((t) => {
        if (t.id === id){
            const newStatus = 
            t.status === "active" ? "finished" :
            t.status === "finished" ? "onhold" :
            t.status === "onhold" ? "cancelled" :
            "active";
            return { ...t, status: newStatus}
        } else {
            return t
        }
    });
    setTasks(updatedTasks)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTasks));
  }

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
                <div className="filter filter-active">
                  <i className="fa-solid fa-circle lightgrey"></i>
                </div>
                <div className="filter filter-finished">
                  <i className="fa-solid fa-check green"></i>
                </div>
                <div className="filter filter-onhold">
                  <i className="fa-solid fa-pause yellow"></i>
                </div>
                <div className="filter filter-cancelled">
                  <i className="fa-solid fa-cancel red"></i>
                </div>
              </div>}
            </div>}
        </div>

        {isCreateActive && <div className="create-task-box">
            Opprett ny oppgave
            <div className="create-task-input-container">
              <input value={newTaskName} onChange={e => setNewTaskName(e.target.value)}/>
              <button onClick={addNewTask}>Opprett</button>
              <i className="fa-solid fa-cancel red red-hover icon-md hover" onClick={clearNewTask}></i>
            </div>
          </div>}

        {/* Tasklist */}
{/* Active tasks */}
<ul className="task-list">
  {tasks.filter(task => task.status === "active").map((task, index) => (
    <Task 
      key={task.id}
      id={task.id} 
      name={task.name} 
      index={index}
      status={task.status}
      onDelete={() => deleteTask(task.id)}
      onStatusChange={() => handleStatusChange(task.id)}
    />
  ))}
</ul>

{/* Non-active tasks */}
<h3 className="card-title">Inaktive</h3>
<ul className="task-list">
  {tasks.filter(task => task.status !== "active").map((task, index) => (
    <Task 
      key={task.id}
      id={task.id} 
      name={task.name} 
      index={index}
      status={task.status}
      onDelete={() => deleteTask(task.id)}
      onStatusChange={() => handleStatusChange(task.id)}
    />
  ))}
</ul>

    </div>
  )
}

export default ToDo