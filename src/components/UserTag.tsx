import avatar from "../assets/defaultAvatar.png"
import { useState, useRef, useEffect } from "react"

type UserTagProps = {
  username: string;
  onLogout: () => void;
};

const UserTag = ({username, onLogout}: UserTagProps) => {
    const [isDropdownActive, setIsDropdownActive] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null);


    const toggleDropdown = () => {
        setIsDropdownActive(!isDropdownActive)
    }

    // Close dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsDropdownActive(false);
        }
      };

      if (isDropdownActive) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isDropdownActive]);

  return (
    <div className="usertag-container" ref={containerRef}>
        <div className="user-tag" onClick={toggleDropdown}>
            <p><strong className="user">{username}</strong></p>
            <img src={avatar} alt="" className="avatar"/>
        </div>
        {isDropdownActive &&
          <div className="usertag-dropdown" onClick={onLogout}>
            Logg ut <i className="fa-solid fa-sign-out grey m-l-1"></i>
          </div>}
    </div>
  )
}

export default UserTag