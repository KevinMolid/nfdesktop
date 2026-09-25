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

const FILTER_STORAGE_KEY = "taskFilters";
const PRIORITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
const STATUSES = ["active", "finished", "onhold", "cancelled"] as const;

type SortMode = "priority" | "title-asc" | "title-desc" | "category-asc";
type TaskWithCategory = TaskData & { category?: string };
const NO_CATEGORY = "__no_category__";
const CATEGORY_MAX_LENGTH = 12;

const DEFAULT_VISIBLE_STATUSES: Record<string, boolean> = {
  active: true,
  finished: true,
  onhold: true,
  cancelled: true,
};

const DEFAULT_VISIBLE_PRIORITIES: Record<number, boolean> = Object.fromEntries(
  PRIORITIES.map((priority) => [priority, true])
) as Record<number, boolean>;

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
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [isEditingNewPriority, setIsEditingNewPriority] = useState(false);

  const [tasks, setTasks] = useState<TaskWithCategory[]>([]);
  const [activeTask, setActiveTask] = useState<number | null>(null);

  const [visibleStatuses, setVisibleStatuses] =
    useState<Record<string, boolean>>(DEFAULT_VISIBLE_STATUSES);
  const [visiblePriorities, setVisiblePriorities] =
    useState<Record<number, boolean>>(DEFAULT_VISIBLE_PRIORITIES);
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (!storedFilters) return;

    try {
      const parsed = JSON.parse(storedFilters);

      if (parsed.visibleStatuses && typeof parsed.visibleStatuses === "object") {
        setVisibleStatuses({
          ...DEFAULT_VISIBLE_STATUSES,
          ...parsed.visibleStatuses,
        });
      }

      if (
        parsed.visiblePriorities &&
        typeof parsed.visiblePriorities === "object"
      ) {
        setVisiblePriorities({
          ...DEFAULT_VISIBLE_PRIORITIES,
          ...parsed.visiblePriorities,
        });
      }

      if (parsed.visibleCategories && typeof parsed.visibleCategories === "object") {
        setVisibleCategories(parsed.visibleCategories);
      }

      if (
        parsed.sortMode === "priority" ||
        parsed.sortMode === "title-asc" ||
        parsed.sortMode === "title-desc" ||
        parsed.sortMode === "category-asc"
      ) {
        setSortMode(parsed.sortMode);
      }
    } catch (e) {
      console.error("Error parsing task filters from localStorage", e);
    }
  }, []);

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
          .filter(isValidTask) as TaskWithCategory[];
        setTasks(dbTasks);
      },
      (err) => console.error("❌ Tasks listener error:", err)
    );

    return () => unsubscribe();
  }, [user?.id]);

  const categoryOptions = Array.from(
    new Set(
      tasks
        .map((task) => task.category?.trim())
        .filter((category): category is string => Boolean(category))
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  useEffect(() => {
    setVisibleCategories((prev) => {
      const next = { ...prev };
      for (const category of categoryOptions) {
        if (next[category] === undefined) next[category] = true;
      }
      if (next[NO_CATEGORY] === undefined) next[NO_CATEGORY] = true;
      return next;
    });
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({
        visibleStatuses,
        visiblePriorities,
        visibleCategories,
        sortMode,
      })
    );
  }, [visibleStatuses, visiblePriorities, visibleCategories, sortMode]);

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
      category: newTaskCategory.trim().slice(0, CATEGORY_MAX_LENGTH),
      id: Date.now(),
      status: "active",
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    setNewTaskName("New task");
    setNewTaskDescription("Task description");
    setNewTaskPriority(0);
    setNewTaskCategory("");
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
    setNewTaskCategory("");
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

  const handleCategoryChange = async (id: number, newCategory: string) => {
    const category = newCategory.trim().slice(0, CATEGORY_MAX_LENGTH);
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, category } : task
    );
    setTasks(updatedTasks);
    await setDoc(
      doc(db, "users", user.id, "tasks", id.toString()),
      updatedTasks.find((task) => task.id === id)!
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

  const activeFilterCategoryCount =
    (Object.values(visibleStatuses).some((visible) => !visible) ? 1 : 0) +
    (PRIORITIES.some((priority) => !visiblePriorities[priority]) ? 1 : 0) +
    (Object.values(visibleCategories).some((visible) => !visible) ? 1 : 0) +
    (sortMode !== "priority" ? 1 : 0);

  const resetFilters = () => {
    setVisibleStatuses({ ...DEFAULT_VISIBLE_STATUSES });
    setVisiblePriorities({ ...DEFAULT_VISIBLE_PRIORITIES });
    setVisibleCategories(
      Object.fromEntries([...categoryOptions, NO_CATEGORY].map((category) => [category, true]))
    );
    setSortMode("priority");
  };

  const compareTasks = (a: TaskWithCategory, b: TaskWithCategory) => {
    if (sortMode === "category-asc") {
      const categoryCompare = (a.category ?? "").localeCompare(
        b.category ?? "",
        undefined,
        { sensitivity: "base" }
      );
      return categoryCompare || a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    if (sortMode === "title-asc") {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }

    if (sortMode === "title-desc") {
      return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
    }

    const aPriority =
      typeof a.priority === "number" && a.priority >= 1 && a.priority <= 10
        ? a.priority
        : 11;

    const bPriority =
      typeof b.priority === "number" && b.priority >= 1 && b.priority <= 10
        ? b.priority
        : 11;

    return aPriority - bPriority;
  };


  return (
    <div className="card has-header grow">
      <div className="card-header">
        <h3 className="card-title">Tasklist</h3>
        <div className="card-header-right">
          <div className="task-filter-control" ref={filterRef}>
            <Button
              variant="transparent"
              size="sm"
              iconLeft={<i className="fa-solid fa-filter"></i>}
              onClick={toggleFiltering}
              className={
                activeFilterCategoryCount > 0
                  ? "task-filter-trigger-active"
                  : ""
              }
            >
              Filter
              {activeFilterCategoryCount > 0 && (
                <span className="task-filter-count">
                  {activeFilterCategoryCount}
                </span>
              )}
            </Button>

            {isFilterActive && (
              <div className="task-filter-panel">
                <div className="task-filter-section">
                  <div className="task-filter-section-title">Status</div>
                  <div className="task-filter-options">
                    {STATUSES.map((status) => {
                      const labels: Record<string, string> = {
                        active: "Active",
                        finished: "Finished",
                        onhold: "Paused",
                        cancelled: "Cancelled",
                      };

                      const icons: Record<string, string> = {
                        active: "fa-circle",
                        finished: "fa-check",
                        onhold: "fa-pause",
                        cancelled: "fa-xmark",
                      };

                      return (
                        <button
                          type="button"
                          key={status}
                          className={`task-filter-option task-filter-status-${status} ${
                            visibleStatuses[status] ? "is-selected" : ""
                          }`}
                          onClick={() =>
                            setVisibleStatuses((prev) => ({
                              ...prev,
                              [status]: !prev[status],
                            }))
                          }
                          aria-pressed={visibleStatuses[status]}
                        >
                          <span className="task-filter-check">
                            {visibleStatuses[status] && (
                              <i className="fa-solid fa-check"></i>
                            )}
                          </span>
                          <i className={`fa-solid ${icons[status]}`}></i>
                          <span>{labels[status]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="task-filter-section">
                  <div className="task-filter-section-title">Priority</div>
                  <div className="task-filter-priorities">
                    {PRIORITIES.map((priority) => (
                      <button
                        type="button"
                        key={priority}
                        className={`task-filter-priority priority-${priority} ${
                          visiblePriorities[priority]
                            ? "is-selected"
                            : "is-filtered-out"
                        }`}
                        onClick={() =>
                          setVisiblePriorities((prev) => ({
                            ...prev,
                            [priority]: !prev[priority],
                          }))
                        }
                        aria-pressed={visiblePriorities[priority]}
                      >
                        {priority === 0 ? "-" : priority}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="task-filter-section">
                  <div className="task-filter-section-title">Category</div>
                  <div className="task-filter-options">
                    {[...categoryOptions, NO_CATEGORY].map((category) => {
                      const selected = visibleCategories[category] !== false;
                      return (
                        <button
                          type="button"
                          key={category}
                          className={`task-filter-option ${selected ? "is-selected" : ""}`}
                          onClick={() =>
                            setVisibleCategories((prev) => ({
                              ...prev,
                              [category]: !selected,
                            }))
                          }
                          aria-pressed={selected}
                        >
                          <span className="task-filter-check">
                            {selected && <i className="fa-solid fa-check"></i>}
                          </span>
                          <span>{category === NO_CATEGORY ? "No category" : category}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="task-filter-section">
                  <div className="task-filter-section-title">Sort by</div>
                  <div className="task-sort-options">
                    <button
                      type="button"
                      className={`task-sort-option ${
                        sortMode === "priority" ? "is-selected" : ""
                      }`}
                      onClick={() => setSortMode("priority")}
                    >
                      <span className="task-sort-radio">
                        {sortMode === "priority" && <span />}
                      </span>
                      Priority
                    </button>

                    <button
                      type="button"
                      className={`task-sort-option ${
                        sortMode === "title-asc" ? "is-selected" : ""
                      }`}
                      onClick={() => setSortMode("title-asc")}
                    >
                      <span className="task-sort-radio">
                        {sortMode === "title-asc" && <span />}
                      </span>
                      Title A–Z
                    </button>

                    <button
                      type="button"
                      className={`task-sort-option ${
                        sortMode === "title-desc" ? "is-selected" : ""
                      }`}
                      onClick={() => setSortMode("title-desc")}
                    >
                      <span className="task-sort-radio">
                        {sortMode === "title-desc" && <span />}
                      </span>
                      Title Z–A
                    </button>
                    <button
                      type="button"
                      className={`task-sort-option ${
                        sortMode === "category-asc" ? "is-selected" : ""
                      }`}
                      onClick={() => setSortMode("category-asc")}
                    >
                      <span className="task-sort-radio">
                        {sortMode === "category-asc" && <span />}
                      </span>
                      Category A–Z
                    </button>
                  </div>
                </div>

                <div className="task-filter-footer">
                  <button
                    type="button"
                    className="task-filter-reset"
                    onClick={resetFilters}
                    disabled={activeFilterCategoryCount === 0}
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            )}
          </div>
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
            <button className={`task-priority priority-${newTaskPriority} outline-none focus:ring-2 focus:ring-offset-1`} onClick={() => setIsEditingNewPriority(!isEditingNewPriority)}>
              <span
                className="task-priority-number"
              >
                {newTaskPriority === 0 ? "-" : newTaskPriority}
              </span>
              {isEditingNewPriority && (
                <div ref={statusDropdownRef}>
                  <ul className="priority-dropdown">
                    {PRIORITIES.map((num) => (
                      <li
                        key={num}
                        className={`priority-${num} rounded-md`}
                        onClick={() => {
                          setNewTaskPriority(num);
                          setIsEditingNewPriority(false);
                        }}
                      >
                        <button className="w-full h-full rounded-md outline-none cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-(--text-color)">
                          {num === 0 ? "-" : num}
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
            <div className="new-task-category-column">
              <input
                className="new-task-input task-category-input"
                value={newTaskCategory}
                list="task-category-options"
                placeholder="Category"
                maxLength={CATEGORY_MAX_LENGTH}
                onChange={(e) => setNewTaskCategory(e.target.value.slice(0, CATEGORY_MAX_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNewTask();
                }}
              />
              <datalist id="task-category-options">
                {categoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
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
          tasks.some((task) => {
            const normalizedPriority =
              typeof task.priority === "number" &&
              PRIORITIES.includes(task.priority)
                ? task.priority
                : 0;

            const categoryKey = task.category?.trim() || NO_CATEGORY;
            return (
              task.status === status &&
              visiblePriorities[normalizedPriority] &&
              visibleCategories[categoryKey] !== false
            );
          }) && (
            <div key={status}>
              {status !== "active" && (
                <h4 className="card-title">
                  {status === "finished"
                    ? "Finished"
                    : status === "onhold"
                    ? "Paused"
                    : "Cancelled"}{" "}
                  tasks
                </h4>
              )}

              <ul className="task-list">
                {tasks
                  .filter((task) => {
                    const normalizedPriority =
                      typeof task.priority === "number" &&
                      PRIORITIES.includes(task.priority)
                        ? task.priority
                        : 0;

                    const categoryKey = task.category?.trim() || NO_CATEGORY;
                    return (
                      task.status === status &&
                      visiblePriorities[normalizedPriority] &&
                      visibleCategories[categoryKey] !== false
                    );
                  })
                  .sort(compareTasks)
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
                      onCategoryChange={handleCategoryChange}
                      categoryOptions={categoryOptions}
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
