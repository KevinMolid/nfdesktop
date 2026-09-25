import { useState, useRef, useEffect } from "react";

type TaskProps = {
  id: number;
  isActive: boolean;
  priority: number;
  name: string;
  description?: string;
  category?: string;
  status: string;
  index: number;
  onStatusChange: (id: number, newStatus: string) => void;
  onDelete: (id: number) => void;
  onClick: () => void;
  onDescriptionChange?: (id: number, newDescription: string) => void;
  onRename?: (id: number, newName: string) => void;
  onPriorityChange?: (id: number, newPriority: number) => void;
  onCategoryChange?: (id: number, newCategory: string) => void;
  categoryOptions?: string[];
};

const STATUS_OPTIONS = ["active", "finished", "onhold", "cancelled"];
const PRIORITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0];
const CATEGORY_MAX_LENGTH = 12;

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  finished: "Finished",
  onhold: "On hold",
  cancelled: "Cancelled",
};

const Task = ({
  id,
  isActive,
  priority,
  name,
  description,
  category,
  status,
  index,
  onStatusChange,
  onClick,
  onDelete,
  onRename,
  onDescriptionChange,
  onPriorityChange,
  onCategoryChange,
  categoryOptions = [],
}: TaskProps) => {
  const [isStatusDropdownActive, setIsStatusDropdownActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedDescription, setEditedDescription] = useState(description ?? "");
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState(category ?? "");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  useEffect(() => setEditedName(name), [name]);
  useEffect(() => setEditedDescription(description ?? ""), [description]);
  useEffect(() => setEditedCategory(category ?? ""), [category]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditingPriority]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const finishEditing = () => {
    setIsEditing(false);
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== name) {
      onRename?.(id, trimmed);
    } else {
      setEditedName(name);
    }
  };

  const finishEditingDescription = () => {
    setIsEditingDescription(false);
    const trimmed = editedDescription.trim();
    if (trimmed !== (description ?? "")) {
      onDescriptionChange?.(id, trimmed);
    }
    setEditedDescription(trimmed);
  };

  const finishEditingCategory = () => {
    setIsEditingCategory(false);
    const trimmed = editedCategory.trim().slice(0, CATEGORY_MAX_LENGTH);
    if (trimmed !== (category ?? "")) {
      onCategoryChange?.(id, trimmed);
    }
    setEditedCategory(trimmed);
  };

  const getStatusIconForOption = (option: string) => {
    switch (option) {
      case "active":
        return <i className="fa-solid fa-circle text-slate-400/60"></i>;
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
      onClick={() => {
        if (!isActive) onClick();
      }}
    >
      <div className="task-main-row">
        <div
          className={`task-priority priority-${priority}`}
          ref={priorityDropdownRef}
        >
          <span
            className="task-priority-number"
            onClick={(event) => {
              event.stopPropagation();
              if (isActive) setIsEditingPriority((prev) => !prev);
              else onClick();
            }}
          >
            {priority === 0 ? "-" : priority}
          </span>

          {isActive && isEditingPriority && (
            <ul className="priority-dropdown">
              {PRIORITIES.map((num) => (
                <li
                  className={`priority-${num}`}
                  key={num}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsEditingPriority(false);
                    onPriorityChange?.(id, num);
                  }}
                >
                  {num === 0 ? "-" : num}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="task-content">
          <div className="task-title-category-row">
            <div className="task-title-cell">
              {isActive && isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  spellCheck={false}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={finishEditing}
                  onClick={(e) => e.stopPropagation()}
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
                <p
                  className="task-title"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (isActive) setIsEditing(true);
                  }}
                >
                  {name}
                </p>
              )}
            </div>

            <div className="task-category-cell">
              {isActive && isEditingCategory ? (
                <>
                  <input
                    type="text"
                    list={`task-category-options-${id}`}
                    value={editedCategory}
                    maxLength={CATEGORY_MAX_LENGTH}
                    placeholder="Category"
                    className="task-category-input"
                    onChange={(e) =>
                      setEditedCategory(e.target.value.slice(0, CATEGORY_MAX_LENGTH))
                    }
                    onBlur={finishEditingCategory}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") finishEditingCategory();
                      if (e.key === "Escape") {
                        setIsEditingCategory(false);
                        setEditedCategory(category ?? "");
                      }
                    }}
                    autoFocus
                  />
                  <datalist id={`task-category-options-${id}`}>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </>
              ) : (
                <button
                  type="button"
                  className={`task-category ${
                    category ? "" : "task-category-empty"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isActive) setIsEditingCategory(true);
                    else onClick();
                  }}
                >
                  {category || "+ Category"}
                </button>
              )}
            </div>
          </div>

          {isActive &&
            (isEditingDescription ? (
              <input
                ref={descriptionRef}
                type="text"
                spellCheck={false}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={finishEditingDescription}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEditingDescription();
                  if (e.key === "Escape") {
                    setIsEditingDescription(false);
                    setEditedDescription(description ?? "");
                  }
                }}
                className="task-description-input"
                autoFocus
              />
            ) : (
              <p
                className="task-description"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDescription(true);
                }}
              >
                {description || "No description"}
              </p>
            ))}
        </div>
      </div>

      {isActive && (
        <div
          className="task-expanded-controls"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="task-status-control" ref={statusDropdownRef}>
            <button
              type="button"
              className={`task-status-button task-status-${status}`}
              onClick={() => setIsStatusDropdownActive((prev) => !prev)}
            >
              {getStatusIconForOption(status)}
              <span>{STATUS_LABELS[status] ?? status}</span>
              <i className="fa-solid fa-chevron-down task-status-chevron"></i>
            </button>

            {isStatusDropdownActive && (
              <div className="status-dropdown task-expanded-status-dropdown">
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
                    <span>{STATUS_LABELS[option]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="task-delete-button"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <i className="fa-solid fa-trash"></i>
            <span>Delete</span>
          </button>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div
          className="task-confirm-backdrop"
          onClick={(event) => {
            event.stopPropagation();
            setIsDeleteConfirmOpen(false);
          }}
        >
          <div
            className="task-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-task-title-${id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-confirm-icon">
              <i className="fa-solid fa-trash"></i>
            </div>
            <div className="task-confirm-content">
              <h4 id={`delete-task-title-${id}`}>Delete task?</h4>
              <p>
                <strong>{name}</strong> will be permanently deleted.
              </p>
            </div>
            <div className="task-confirm-actions">
              <button
                type="button"
                className="task-confirm-cancel"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="task-confirm-delete"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  onDelete(id);
                }}
              >
                <i className="fa-solid fa-trash"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default Task;
