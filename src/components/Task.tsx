import { useState, useRef, useEffect } from "react";

type TaskProps = {
  id: number;
  isActive: boolean;
  priority: number;
  name: string;
  description?: string;
  status: string;
  index: number;
  onStatusChange: (id: number, newStatus: string) => void;
  onDelete: (id: number) => void;
  onClick: () => void;
  onDescriptionChange?: (id: number, newDescription: string) => void;
  onRename?: (id: number, newName: string) => void;
  onPriorityChange?: (id: number, newPriority: number) => void; // NEW
};

const STATUS_OPTIONS = ["active", "finished", "onhold", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  active: "active",
  finished: "finished",
  onhold: "on hold",
  cancelled: "cancelled",
};

const Task = ({
  id,
  isActive,
  priority,
  name,
  description,
  status,
  index,
  onStatusChange,
  onClick,
  onDelete,
  onRename,
  onDescriptionChange,
  onPriorityChange,
}: TaskProps) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [isStatusDropdownActive, setIsStatusDropdownActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedDescription, setEditedDescription] = useState(description ?? "");
  const [isEditingPriority, setIsEditingPriority] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  /* Handle click outside dropdown */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Handle click outside status dropdown */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Handle click outside priority dropdown */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditingPriority(false);
      }
    };

    if (isEditingPriority) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditingPriority]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const toggleDropdown = () => setIsDropdownActive((prev) => !prev);
  const toggleStatusDropdown = () => setIsStatusDropdownActive((prev) => !prev);

  const finishEditing = () => {
    setIsEditing(false);
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== name) {
      if (onRename) {
        onRename(id, trimmed);
      } else {
        console.log(`Task ${id} renamed to: ${trimmed}`);
      }
    } else {
      setEditedName(name); // Revert if empty or unchanged
    }
  };

  const finishEditingDescription = () => {
    setIsEditingDescription(false);
    const trimmed = editedDescription?.trim() ?? "";

    // Only update if it's different, even if it's empty
    if (trimmed !== description) {
      if (onDescriptionChange) {
        onDescriptionChange(id, trimmed);
      } else {
        console.log(`Task ${id} description set to: ${trimmed}`);
      }
    }

    // Always sync local state with the final value
    setEditedDescription(trimmed);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return (
          <i
            className="fa-solid fa-circle lightgrey hover"
            onClick={toggleStatusDropdown}
          ></i>
        );
      case "finished":
        return (
          <i
            className="fa-solid fa-check green hover"
            onClick={toggleStatusDropdown}
          ></i>
        );
      case "onhold":
        return (
          <i
            className="fa-solid fa-pause yellow hover"
            onClick={toggleStatusDropdown}
          ></i>
        );
      case "cancelled":
        return (
          <i
            className="fa-solid fa-xmark red hover"
            onClick={toggleStatusDropdown}
          ></i>
        );
      default:
        return null;
    }
  };

  const getStatusIconForOption = (option: string) => {
    switch (option) {
      case "active":
        return <i className="fa-solid fa-circle lightgrey"></i>;
      case "finished":
        return <i className="fa-solid fa-check green"></i>;
      case "onhold":
        return <i className="fa-solid fa-pause yellow"></i>;
      case "cancelled":
        return <i className="fa-solid fa-xmark red"></i>;
      default:
        return null;
    }
  };

  return (
    <li
      className={`task task-${status} ${isActive ? "active-task" : ""}`}
      key={"task" + index}
      onClick={onClick}
    >
      <div className="task-info">
        <div onClick={toggleDropdown} className="icon-div task-action hover">
          <i className="fa-solid fa-bars"></i>
        </div>

        <div
          className={`task-priority priority-${priority}`}
          ref={priorityDropdownRef}
        >
          <span
            className="task-priority-number"
            onClick={() => setIsEditingPriority(!isEditingPriority)}
          >
            {priority ? priority : "0"}
          </span>
          {isEditingPriority && (
            <div>
              <ul className="priority-dropdown">
                {[0, 1, 2, 3].map((num) => {
                  return (
                    <li
                      className={`priority-${num}`}
                      key={num}
                      onClick={() => {
                        setIsEditingPriority(false);
                        if (onPriorityChange) onPriorityChange(id, num);
                      }}
                    >
                      {num}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div>
          {/* Task title */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishEditing();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditedName(name);
                }
              }}
              className="task-edit-input"
            />
          ) : (
            <p className="task-title" onDoubleClick={() => setIsEditing(true)}>
              {name}
            </p>
          )}

          {/* Task description */}
          {isEditingDescription ? (
            <input
              ref={descriptionRef}
              type="text"
              value={editedDescription ?? ""}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={finishEditingDescription}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishEditingDescription();
                if (e.key === "Escape") {
                  setIsEditingDescription(false);
                  setEditedDescription(description || "");
                }
              }}
              className="task-description-input"
            />
          ) : (
            <p
              className="task-description"
              onDoubleClick={() => setIsEditingDescription(true)}
            >
              {description || (isActive ? "..." : "")}
            </p>
          )}
        </div>
      </div>

      <div className="task-status icon-div" ref={statusDropdownRef}>
        {getStatusIcon()}

        {isStatusDropdownActive && (
          <div className="status-dropdown">
            {STATUS_OPTIONS.map((option) => (
              <div
                key={option}
                className={`dropdown-item hover-border task-${option}`}
                onClick={() => {
                  onStatusChange(id, option);
                  setIsStatusDropdownActive(false);
                }}
              >
                <div className="dropdown-item-icon-container">
                  {getStatusIconForOption(option)}
                </div>
                <span
                  style={{ marginLeft: "8px", textTransform: "capitalize" }}
                >
                  {STATUS_LABELS[option]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDropdownActive && (
        <div className="task-dropdown" ref={dropdownRef}>
          <div
            className="dropdown-item default-select hover-border"
            onClick={() => onDelete(id)}
          >
            <div className="dropdown-item-icon-container">
              <i className="fa-solid fa-trash red"></i>
            </div>
            <span style={{ marginLeft: "8px" }}>Delete</span>
          </div>
        </div>
      )}
    </li>
  );
};

export default Task;
