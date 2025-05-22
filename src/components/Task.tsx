import { useState } from "react";

type TaskProps = {
    id: number;
    name: string;
    status: string;
    index: number;
    onStatusChange: (status: string) => void;
    onDelete: (id: number) => void;
}

const Task = ({id, name, status, index, onStatusChange, onDelete}: TaskProps) => {
    const [isDropdownActive, setIsDropdownActive] = useState(false)

    const toggleDropdown = () => {
        setIsDropdownActive(!isDropdownActive)
    }

  return (
    <li className={`task task-${status}`} key={"task"+index}>
        <div className="task-info">
        <i className="fa-solid fa-ellipsis-vertical grey hover"
            onClick={toggleDropdown}></i>
        <p>{name}</p>
        </div>
        {status === "active" && <i className="fa-solid fa-circle lightgrey hover" 
            onClick={() => onStatusChange(status)}></i>}
        {status === "finished" && <i className="fa-solid fa-check green hover" 
            onClick={() => onStatusChange(status)}></i>}
        {status === "onhold" && <i className="fa-solid fa-pause yellow hover" 
            onClick={() => onStatusChange(status)}></i>}
        {status === "cancelled" && <i className="fa-solid fa-cancel red hover" 
            onClick={() => onStatusChange(status)}></i>}
        {isDropdownActive && <div className="task-dropdown">
            <div className="hover" onClick={() => onDelete(id)}>
                <i className="fa-solid fa-trash red"></i> Slett oppgave
            </div>
        </div>}
    </li>
  )
}

export default Task