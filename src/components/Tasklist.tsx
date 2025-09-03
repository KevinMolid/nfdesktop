import { useState, useEffect, useRef } from "react";
import Task from "./Task";
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  query,
} from "firebase/firestore";

import { TaskData } from "../types";
import { isValidTask } from "../utils/validators";

const FILTER_STORAGE_KEY = "visibleStatuses";

type User = {
  id: string;
  username: string;
  role: string;
};

type TasklistProps = {
  user: User;
  toggleActive: (name: string) => void;
};

const ToDo = ({ user, toggleActive }: TasklistProps) => {
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [newTaskName, setNewTaskName] = useState("Task name");
  const [newTaskDescription, setNewTaskDescription] =
    useState("Task description");
  const [newTaskPriority, setNewTaskPriority] = useState(0);
  const [isEditingNewPriority, setIsEditingNewPriority] = useState(false);

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [activeTask, setActiveTask] = useState<number | null>(null);

  const [visibleStatuses, setVisibleStatuses] = useState<
    Record<string, boolean>
  >(() => {
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
    if (typeof user?.id !== "string" || user.id.includes("//")) {
      console.error("❌ Invalid user ID detected:", user?.id);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
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
    if (!user?.id) return;

    const tasksRef = collection(db, "users", user.id, "tasks");
    // You can add orderBy(...) here if you want, e.g.:
    // const q = query(tasksRef, orderBy("status"), orderBy("priority"));
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dbTasks = snapshot.docs
          .map((d) => d.data())
          .filter(isValidTask) as TaskData[];
        setTasks(dbTasks);
      },
      (err) => console.error("❌ Tasks listener error:", err)
    );

    return () => unsubscribe();
  }, [user?.id]);

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
      priority: newTaskPriority,
      name: newTaskName,
      description: newTaskDescription,
      id: Date.now(),
      status: "active",
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskName("New task");
    setNewTaskDescription("Task description");
    setNewTaskPriority(0)
    setIsCreateActive(false);
    const taskPath = `users/${user.id}/tasks/${newTask.id}`;
    if (taskPath.includes("//")) {
      console.warn(
        "🔥 Invalid Firestore path in addNewTask:",
        taskPath,
        newTask
      );
    }
    await setDoc(
      doc(db, "users", user.id, "tasks", newTask.id.toString()),
      newTask
    );
  };

  const discardNewTask = () => {
    setNewTaskName("New task");
    setNewTaskDescription("Task description");
    setNewTaskPriority(0)
    setIsCreateActive(false);
  }

  const handleRename = async (id: number, newName: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, name: newName } : task
    );
    setTasks(updatedTasks);
    const renamePath = `users/${user.id}/tasks/${id}`;
    if (renamePath.includes("//")) {
      console.warn("🔥 Invalid Firestore path in handleRename:", renamePath);
    }
    await setDoc(
      doc(db, "users", user.id, "tasks", id.toString()),
      updatedTasks.find((t) => t.id === id)!
    );
  };

  const handleDescriptionChange = async (
    id: number,
    newDescription: string
  ) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, description: newDescription } : task
    );
    setTasks(updatedTasks);
    const newDescriptionPath = `users/${user.id}/tasks/${id}`;
    if (newDescriptionPath.includes("//")) {
      console.warn(
        "🔥 Invalid Firestore path in handleDescriptionChange:",
        newDescriptionPath
      );
    }
    await setDoc(
      doc(db, "users", user.id, "tasks", id.toString()),
      updatedTasks.find((t) => t.id === id)!
    );
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const updatedTasks = tasks.map((t) =>
      t.id === id ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    const statusPath = `users/${user.id}/tasks/${id}`;
    if (statusPath.includes("//")) {
      console.warn(
        "🔥 Invalid Firestore path in handleStatusChange:",
        statusPath
      );
    }
    await setDoc(
      doc(db, "users", user.id, "tasks", id.toString()),
      updatedTasks.find((t) => t.id === id)!
    );
  };

  const handlePriorityChange = async (id: number, newPriority: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, priority: newPriority } : task
    );
    setTasks(updatedTasks);
    const priorityPath = `users/${user.id}/tasks/${id}`;
    if (priorityPath.includes("//")) {
      console.warn(
        "🔥 Invalid Firestore path in handlePriorityChange:",
        priorityPath
      );
    }
    await setDoc(
      doc(db, "users", user.id, "tasks", id.toString()),
      updatedTasks.find((t) => t.id === id)!
    );
  };

  const deleteTask = async (id: number) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
    const deletePath = `users/${user.id}/tasks/${id}`;
    if (deletePath.includes("//")) {
      console.warn("🔥 Invalid Firestore path in deleteTask:", deletePath);
    }
    await deleteDoc(doc(db, "users", user.id, "tasks", id.toString()));
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Tasklist</h3>
        <div className="card-header-right">
          <div className="icon-container">
            <button onClick={toggleFiltering}>
              <i className="fa-solid fa-filter grey icon-md hover"></i>
              Filter
            </button>
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
                    {status === "active" && (
                      <i className="fa-solid fa-circle lightgrey"></i>
                    )}
                    {status === "finished" && (
                      <i className="fa-solid fa-check green"></i>
                    )}
                    {status === "onhold" && (
                      <i className="fa-solid fa-pause yellow"></i>
                    )}
                    {status === "cancelled" && (
                      <i className="fa-solid fa-xmark red"></i>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="close-widget-btn"
            onClick={() => toggleActive("Tasks")}
          >
            <i className="fa-solid fa-x icon-md hover" />
          </button>
        </div>
      </div>

      {/* Tasklist */}
      {/* Header */}
      <div>
        <ul className="tasklist-header">
          <li>Action</li>
          <li>Priority</li>
          <li>Task description</li>
          <li>Status</li>
        </ul>
      </div>

      {/* New task */}
      <div
        className={
          isCreateActive ? "new-task-element-active" : "new-task-element"
        }
        onClick={() => {
          !isCreateActive && toggleCreateActive();
        }}
      >
        {!isCreateActive && (
          <p className="new-task-title">
            <i className="fa-solid fa-plus grey hover"></i> New task
          </p>
        )}
        {isCreateActive && (
          <>
            <div className="task-info">
              <div className="icon-div new-task-action">
                <i className="fa-solid fa-bars"></i>
              </div>

              <div className={`task-priority priority-${newTaskPriority}`}>
                <span
                  className="task-priority-number"
                  onClick={() => setIsEditingNewPriority(!isEditingNewPriority)}
                >
                  {newTaskPriority}
                </span>
                {isEditingNewPriority && (
                  <div>
                    <ul className="priority-dropdown">
                      {[0, 1, 2, 3].map((num) => (
                        <li
                          key={num}
                          className={`priority-${num}`}
                          onClick={() => {
                            setNewTaskPriority(num);
                            setIsEditingNewPriority(false);
                          }}
                        >
                          {num}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="new-task-inputs">
                <input
                  className="new-task-input"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addNewTask();
                  }}
                />
                <input
                  className="new-task-input task-description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addNewTask();
                  }}
                />
              </div>
            </div>

            <div className="new-task-btn-container">
              <button onClick={addNewTask} className="save-btn">
                <i className="fa-solid fa-floppy-disk icon-md"></i>
                Save
              </button>

              <button onClick={discardNewTask} className="delete-btn">
                <i className="fa-solid fa-trash icon-md"></i>
                Discard
              </button>
            </div>
          </>
        )}
      </div>

      {Object.entries(visibleStatuses).map(
        ([status, visible]) =>
          visible &&
          tasks.some((t) => t.status === status) && (
            <div key={status}>
              {status !== "active" && (
                <h4 className="card-title">
                  {status === "finished"
                    ? "Finished"
                    : status === "onhold"
                    ? "Paused"
                    : "Calcelled"}{" "}
                  tasks
                </h4>
              )}
              <ul className="task-list">
                {tasks
                  .filter((t) => t.status === status)
                  .sort((a, b) => {
                    const priorities = [1, 2, 3, 0];

                    const getPriorityIndex = (task: TaskData) => {
                      if (typeof task.priority !== "number") {
                        console.warn("Task has non-number priority:", task);
                        return priorities.length; // send to end of list
                      }

                      const index = priorities.indexOf(task.priority);
                      if (index === -1) {
                        console.warn(
                          "Task has unexpected priority value:",
                          task
                        );
                        return priorities.length; // send to end of list
                      }

                      return index;
                    };

                    const aIndex = getPriorityIndex(a);
                    const bIndex = getPriorityIndex(b);

                    return aIndex - bIndex;
                  })
                  .map((task, index) => (
                    <Task
                      key={task.id}
                      {...task}
                      isActive={activeTask === task.id}
                      onClick={() => setActiveTask(task.id)}
                      index={index}
                      onDelete={() => deleteTask(task.id)}
                      onStatusChange={handleStatusChange}
                      onRename={handleRename}
                      onDescriptionChange={handleDescriptionChange}
                      onPriorityChange={handlePriorityChange}
                    />
                  ))}
              </ul>
            </div>
          )
      )}
    </div>
  );
};

export default ToDo;
