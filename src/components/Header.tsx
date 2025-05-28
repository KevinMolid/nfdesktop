import Burgermenu from "./Burgermenu"
import UserTag from "./UserTag";

import logoB from "../assets/logo-b.png"

type MenuProps = {
  username: string;
  widgets: {name: string, active: boolean}[];
  toggleActive: (name:string) => void;
  onLogout: () => void;
};

const Header = ({username, widgets, toggleActive, onLogout}: MenuProps) => {
  return (
    <header>
        <div className='top-header'>
            <i className="fa-regular fa-comment"></i>
            <h2>Tilbakemeldinger?</h2>
            <button>Send her</button>
        </div>
        <div className="bottom-header">
            <div className="menu-bar">
                <div className="menu-bar-left">
                    <Burgermenu widgets={widgets} toggleActive={toggleActive}/>
                </div>
                <div className='logo'>
                    <a href="https://www.norronafly.com/" target="_blank">
                        <img src={logoB} alt="Norrønafly logo" className='nflogo'/>
                    </a>
                </div>
                <div className="menu-bar-right">
                    <UserTag username={username} onLogout={onLogout}/>
                </div>
            </div>
      </div>
    </header>
  )
}

export default Header