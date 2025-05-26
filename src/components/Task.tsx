import { useState, useRef, useEffect } from "react";

type TaskProps = {
  id: number;
  name: string;
  status: string;
  index: number;
  onStatusChange: (id: number, newStatus: string) => void;
  onDelete: (id: number) => void;
};

const STATUS_OPTIONS = ["active", "finished", "onhold", "cancelled"];

const Task = ({ id, name, status, index, onStatusChange, onDelete }: TaskProps) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [isStatusDropdownActive, setIsStatusDropdownActive] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownActive((prev) => !prev);
  const toggleStatusDropdown = () => setIsStatusDropdownActive((prev) => !prev);

  // Close status dropdown on outside click
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

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <i className="fa-solid fa-circle lightgrey hover" onClick={toggleStatusDropdown}></i>;
      case "finished":
        return <i className="fa-solid fa-check green hover" onClick={toggleStatusDropdown}></i>;
      case "onhold":
        return <i className="fa-solid fa-pause yellow hover" onClick={toggleStatusDropdown}></i>;
      case "cancelled":
        return <i className="fa-solid fa-xmark red hover" onClick={toggleStatusDropdown}></i>;
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
    <li className={`task task-${status}`} key={"task" + index}>
      <div className="task-info">
        <i className="fa-solid fa-ellipsis-vertical grey hover" onClick={toggleDropdown}></i>
        <p>{name}</p>
      </div>

      <div className="task-status" style={{ position: "relative" }} ref={statusDropdownRef}>
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
                    <div className="dropdown-item-icon-container">{getStatusIconForOption(option)}</div>
                    <span style={{ marginLeft: "8px", textTransform: "capitalize" }}>{option}</span>
                </div>
                ))}
          </div>
        )}
      </div>

      {isDropdownActive && (
        <div className="task-dropdown">
          <div className="hover" onClick={() => onDelete(id)}>
            <i className="fa-solid fa-trash red"></i> Slett oppgave
          </div>
        </div>
      )}
    </li>
  );
};

export default Task;
