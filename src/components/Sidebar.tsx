import { useState } from "react";
import { Sidebar, Menu, MenuItem, Logo } from "react-mui-sidebar";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/logo-white-small.png";
import logoNotext from "../assets/logo-white-small-notext.png";

import avatar from "../assets/defaultAvatar.png";

type SidebarProps = {
  username: string;
  name: string;
  imgurl?: string;
  onLogout: () => void;
};

const SidebarComponent = ({ username, name, imgurl, onLogout }: SidebarProps) => {
  const location = useLocation();

  // 👇 control collapsed / expanded
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  return (
    <div className="sidebar-container">
      <Sidebar
        width={collapsed ? "80px" : "270px"}
        textColor="white"
        isCollapse={collapsed}
        themeColor="#ee5a15ff"
        themeSecondaryColor="#ffffff"
        userName={username}
        designation={name}
        userimg={imgurl || avatar}
        onLogout={onLogout}
      >
        <Logo img={collapsed ? logoNotext : logo} component={NavLink} href="/">
          {/* You can hide text when collapsed if you want */}
          {!collapsed && "Norrønafly"}
        </Logo>

        {/* Optional small toggle button on top of sidebar */}
        <div className={collapsed ? "sidebar-toggle-btn-container-collapsed" : "sidebar-toggle-btn-container"}>
          <button
            className="sidebar-toggle-btn"
            onClick={toggleCollapsed}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <i className="fa-solid fa-angles-right icon-md"></i>
            ) : (
              <i className="fa-solid fa-angles-left icon-md"></i>
            )}
          </button>
        </div>

        <Menu subHeading="WORK">
          <MenuItem
            icon={<i className="fa-solid fa-desktop icon-md"></i>}
            component={NavLink}
            link="/"
            isSelected={location.pathname === "/"}
            textFontSize="1rem"
          >
            {!collapsed && "Dashboard"}
          </MenuItem>

          <MenuItem
            icon={<i className="fa-solid fa-screwdriver-wrench icon-md"></i>}
            component={NavLink}
            link="/tools"
            isSelected={location.pathname === "/tools"}
            textFontSize="1rem"
          >
            {!collapsed && "Tools"}
          </MenuItem>

        </Menu>
        <Menu subHeading="FOOD">

          <MenuItem
            icon={
              <div className="icon-div">
                <i className="fa-solid fa-burger icon-md"></i>
              </div>
            }
            component={NavLink}
            link="/foodorders"
            isSelected={location.pathname === "/foodorders"}
            textFontSize="1rem"
          >
            {!collapsed && "Food orders"}
          </MenuItem>

        </Menu>
        <Menu subHeading="SOCIAL">

          <MenuItem
            icon={<div className="icon-sidebar">
              <i className="fa-solid fa-message icon-md"></i>
              </div>}
            component={NavLink}
            link="/chat"
            isSelected={location.pathname === "/chat"}
            textFontSize="1rem"
          >
            {!collapsed && "Chat"}
          </MenuItem>

          <MenuItem
            icon={
              <div className="icon-sidebar">
                <i className="fa-solid fa-users icon-md"></i>
              </div>
            }
            component={NavLink}
            link="/users"
            isSelected={location.pathname === "/users"}
            textFontSize="1rem"
          >
            {!collapsed && "Users"}
          </MenuItem>

        </Menu>
        <Menu subHeading="OTHER">

          <MenuItem
            icon={<div className="icon-sidebar">
              <i className="fa-solid fa-gear icon-md"></i>
            </div>}
            component={NavLink}
            link="/settings"
            isSelected={location.pathname === "/settings"}
            textFontSize="1rem"
          >
            {!collapsed && "Settings"}
          </MenuItem>
        </Menu>
      </Sidebar>
    </div>
  );
};

export default SidebarComponent;
