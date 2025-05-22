import { useState } from "react"

type MenuProps = {
  widgets: {name: string, active: boolean}[];
  toggleActive: (name:string) => void;
};

const Burgermenu = ({widgets, toggleActive}: MenuProps) => {
    const [isActive, setIsActive] = useState(false)

    const toggleMenuActive = () => {
        setIsActive(!isActive)
    }

  return (
    <div>
        <i className="fa-solid fa-bars icon-md burgermenu" 
            onClick={toggleMenuActive}></i>
        {isActive && <div className="burger-dropdown">
            <ul>
                {widgets.map((widget, index) => 
                    widget.active ? 
                    <li className="burger-li burger-li-active" key={"burger" + index}
                        onClick={() => toggleActive(widget.name)}>
                        <p>{widget.name}</p>
                        <i className="fa-solid fa-check"></i>
                    </li> : 
                    <li className="burger-li burger-li-inactive" key={"burger" + index}
                        onClick={() => toggleActive(widget.name)}>
                        <p>{widget.name}</p>
                        <i className="fa-solid fa-cancel"></i>
                    </li>
                )}
            </ul>
        </div>}
    </div>
  )
}

export default Burgermenu