import { useState, useRef, useEffect } from "react"

type MenuProps = {
  widgets: {name: string, active: boolean}[];
  toggleActive: (name:string) => void;
};

const Burgermenu = ({widgets, toggleActive}: MenuProps) => {
    const [isActive, setIsActive] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleMenuActive = () => {
        setIsActive(!isActive)
    }

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsActive(false);
        }
      };

      if (isActive) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isActive]);

  return (
    <div className="burgermenu" ref={containerRef} onClick={toggleMenuActive}>
      <i className="fa-solid fa-bars icon-md" ></i>
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