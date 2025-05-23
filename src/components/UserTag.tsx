import avatar from "../assets/avatar.jpg"
import { useState } from "react"

type UserTagProps = {
  username: string;
  onLogout: () => void;
};

const UserTag = ({username, onLogout}: UserTagProps) => {
    const [isDropdownActive, setIsDropdownActive] = useState(false)

    const toggleDropdown = () => {
        setIsDropdownActive(!isDropdownActive)
    }

  return (
    <div className="usertag-container">
        <div className="user-tag" onClick={toggleDropdown}>
            <p>{username}</p>
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