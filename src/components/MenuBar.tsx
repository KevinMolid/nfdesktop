import Burgermenu from "./Burgermenu"
import Clock from "./Clock"
import Dateline from "./Date"
import UserTag from "./UserTag"

type MenuProps = {
  widgets: {name: string, active: boolean}[];
  toggleActive: (name:string) => void;
};

const MenuBar = ({widgets, toggleActive}: MenuProps) => {
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
        <UserTag />
      </div>
    </header>
  )
}

export default MenuBar