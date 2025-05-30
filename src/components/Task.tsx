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
const STATUS_LABELS: Record<string, string> = {
  active: "aktiv",
  finished: "ferdig",
  onhold: "pause",
  cancelled: "kansellert",
};

const Task = ({ id, name, status, index, onStatusChange, onDelete }: TaskProps) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [isStatusDropdownActive, setIsStatusDropdownActive] = useState(false);

 const dropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownActive((prev) => !prev);
  const toggleStatusDropdown = () => setIsStatusDropdownActive((prev) => !prev);

  // Close dropdown on outside click
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
    <li className={`task task-${status} hover-border`} key={"task" + index}>
      <div className="task-info">
        <div onClick={toggleDropdown} 
            className="icon-div hover">
        <i className="fa-solid fa-ellipsis-vertical grey"></i>
        </div>
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
                    <span style={{ marginLeft: "8px", textTransform: "capitalize" }}>{STATUS_LABELS[option]}</span>
                </div>
                ))}
          </div>
        )}
      </div>

      {isDropdownActive && (
        <div className="task-dropdown" ref={dropdownRef}>
          <div className="dropdown-item default-select hover-border" onClick={() => onDelete(id)}>
            <div className="dropdown-item-icon-container">
              <i className="fa-solid fa-trash red"></i></div> 
              <span style={{ marginLeft: "8px" }}>Slett oppgave</span>
          </div>
        </div>
      )}
    </li>
  );
};

export default Task;
