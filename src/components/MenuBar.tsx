import Burgermenu from "./Burgermenu"
import Clock from "./Clock"
import Dateline from "./Date"
import UserTag from "./UserTag"

type MenuProps = {
  username: string;
  widgets: {name: string, active: boolean}[];
  toggleActive: (name:string) => void;
  onLogout: () => void;
};

const MenuBar = ({username, widgets, toggleActive, onLogout}: MenuProps) => {
  return (
    <header className="menu-bar">
      <div className="menu-bar-left">
        <Burgermenu widgets={widgets} toggleActive={toggleActive}/>
      </div>
      <div className="menu-bar-center">
        <Dateline />
        <Clock />
      </div>
      <div className="menu-bar-right">
        <UserTag username={username} onLogout={onLogout}/>
      </div>
    </header>
  )
}

export default MenuBar