import avatar from "../assets/avatar.jpg"
import { useState } from "react"

const UserTag = () => {
    const [isDropdownActive, setIsDropdownActive] = useState(false)

    const toggleDropdown = () => {
        setIsDropdownActive(!isDropdownActive)
    }

  return (
    <div className="usertag-container">
        <div className="user-tag" onClick={toggleDropdown}>
            <p>Kevin Molid</p>
            <img src={avatar} alt="" className="avatar"/>
        </div>
        {isDropdownActive && <div className="usertag-dropdown">Logg ut <i className="fa-solid fa-sign-out grey m-l-1"></i></div>}
    </div>
  )
}

export default UserTag