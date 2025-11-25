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

import Button from "./Button";

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
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof user?.id !== "string" || user.id.includes("//")) {
      console.error("❌ Invalid user ID detected:", user?.id);
    }
  }, [user]);

  /* Handle click outside status dropdown */
  useEffect(() => {
    const handleClickOutsideStatus = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingNewPriority(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideStatus);
    return () => document.removeEventListener("mousedown", handleClickOutsideStatus);
  }, []);

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
    setNewTaskPriority(0);
    setIsEditingNewPriority(false);
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
    setNewTaskPriority(0);
    setIsEditingNewPriority(false);
    setIsCreateActive(false);
  };

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
    <div className="card has-header grow">
      <div className="card-header">
        <h3 className="card-title">Tasklist</h3>
        <div className="card-header-right">
          <Button
            variant="transparent"
            size="sm"
            iconLeft={<i className="fa-solid fa-filter"></i>}
            onClick={toggleFiltering}
          >
            Filter
          </Button>
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
                    <i className="fa-solid fa-circle text-slate-400/60"></i>
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
          <Button
            variant="transparent"
            size="sm"
            onClick={() => toggleActive("Tasks")}
          >
            <i className="fa-solid fa-x" />
          </Button>
        </div>
      </div>

      {/* Tasklist */}
      {/* Header */}
      <div>
        <ul className="tasklist-header">
          <li>Menu</li>
          <li>Priority</li>
          <li>Description</li>
          <li>Status</li>
        </ul>
      </div>

      {/* New task */}
      {!isCreateActive ? (
        <button
          type="button"
          className="new-task-element border-2 border-dashed
            border-(--border-color) focus:outline-none
            focus:outline-none focus:ring-2 focus:ring-offset-1
            focus:ring-(--text-color) focus:border-none"
          onClick={toggleCreateActive}
          aria-expanded="false"
          aria-label="Create new task"
        >
          <p className="new-task-title">
            <i className="fa-solid fa-plus grey hover" aria-hidden="true"></i>
            New task
          </p>
        </button>
      ) : (
        <div
          className="new-task-element-active"
          aria-expanded="true"
        >
          <div className="task-info">
            <div className="icon-div new-task-action">
              <i className="fa-solid fa-bars"></i>
            </div>

            <button className={`task-priority priority-${newTaskPriority} outline-none focus:ring-2 focus:ring-offset-1`} onClick={() => setIsEditingNewPriority(!isEditingNewPriority)}>
              <span
                className="task-priority-number"
              >
                {newTaskPriority}
              </span>
              {isEditingNewPriority && (
                <div ref={statusDropdownRef}>
                  <ul className="priority-dropdown">
                    {[0, 1, 2, 3].map((num) => (
                      <li
                        key={num}
                        className={`priority-${num} rounded-md`}
                        onClick={() => {
                          setNewTaskPriority(num);
                          setIsEditingNewPriority(false);
                        }}
                      >
                        <button className="w-full h-full rounded-md outline-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-(--text-color)">
                          {num}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </button>

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
            <Button
              onClick={addNewTask}
              className="save-btn"
              iconLeft={<i className="fa-solid fa-floppy-disk"></i>}
            >
              Save
            </Button>

            <Button
              variant="secondary"
              onClick={discardNewTask}
              className="delete-btn"
              iconLeft={<i className="fa-solid fa-trash"></i>}
            >
              Discard
            </Button>
          </div>
        </div>
      )}


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
