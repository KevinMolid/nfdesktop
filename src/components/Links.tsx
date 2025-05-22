import { useState } from "react"

const Links = () => {
  const [isActive1, setIsActive1] = useState(false)
  const [isActive2, setIsActive2] = useState(false)
  const [isActive3, setIsActive3] = useState(false)
  const [isActive4, setIsActive4] = useState(false)

  const links = [
    {category: "Internt",
      links: [{name: "Avvik- Fossum IT",
        href: "https://norrprop.fossumit.no/norrprop.nsf/index?openview"
      },
      {name: "Eco Online",
        href: "https://app.ecoonline.com/login/"
      }]
    }
  ]

  const toggle1 = () => {
    setIsActive1(!isActive1)
  } 

  const toggle2 = () => {
    setIsActive2(!isActive2)
  } 

  const toggle3 = () => {
    setIsActive3(!isActive3)
  } 

  const toggle4 = () => {
    setIsActive4(!isActive4)
  } 

  return (
    <div className="card has-header grow-1">
        <div className="card-header">
            <h3 className="card-title">Lenker</h3>
            <i className="fa-solid fa-plus blue icon-md"></i>
        </div>

      <div className="ul-heading" onClick={toggle1}>
        <h4>Internt</h4>
        {isActive1 ? <i className="fa-solid fa-caret-up lightgrey"></i> : <i className="fa-solid fa-caret-down lightgrey"></i>}
      </div>
      {isActive1 && <ul>
        <li>      
          <a href="https://norrprop.fossumit.no/norrprop.nsf/index?openview
          " target="_blank">Avvik - Fossum IT</a>
        </li>
        <li>
          <a href="https://app.ecoonline.com/login/" target="_blank">Eco Online</a>
        </li>
      </ul>}

      {/* Leverandørliste */}
      <div className="ul-heading" onClick={toggle2}>
        <h4>Leverandører</h4>
        {isActive2 ? <i className="fa-solid fa-caret-up lightgrey"></i> : <i className="fa-solid fa-caret-down lightgrey"></i>}
      </div>
      {isActive2 && <ul>
        <li>      
          <a href="https://shop.boeing.com/aviation-supply/
          " target="_blank">Avial (Boeing)</a>
        </li>
        <li>
          <a href="https://www.boeingdistribution.com/index.jsp" target="_blank">Boeing</a>
        </li>
        <li>
          <a href="https://www.customers.utcaerospacesystems.com/ngp-my-account" target="_blank">Collins</a>
        </li>
        <li>
          <a href="https://online.hartzellprop.com/Instance2EnvMMLogin/html/login.html" target="_blank">Hartzell</a>
        </li>
        <li>
          <a href="https://skygeek.com/" target="_blank">Skygeek</a>
        </li>
        <li>
          <a href="https://ww2.txtav.com/" target="_blank">Textron</a>
        </li>
      </ul>}

      <div className="ul-heading" onClick={toggle3}>
        <h4>Verktøy</h4>
        {isActive3 ? <i className="fa-solid fa-caret-up lightgrey"></i> : <i className="fa-solid fa-caret-down lightgrey"></i>}
      </div>
      {isActive3 && <ul>
        <li>
          <a href="https://labservices.kiwa.com/eCal_NO/Login.aspx?nochk=-1&lng=EN" target="_blank">Kiwa</a>
        </li>
      </ul>}

      <div className="ul-heading" onClick={toggle4}>
        <h4>Transport</h4>
        {isActive4 ? <i className="fa-solid fa-caret-up lightgrey"></i> : <i className="fa-solid fa-caret-down lightgrey"></i>}
      </div>
      {isActive4 && <ul>
        <li>
          <a href="https://www.mybring.com/frontpage/index.html" target="_blank">Bring</a>
        </li>
        <li>      
          <a href="https://mydhl.express.dhl/no/en/home.html#/createNewShipmentTab
          " target="_blank">DHL</a>
        </li>
        <li>
          <a href="https://www.fedex.com" target="_blank">FedEx</a>
        </li>
        <li>
          <a href="https://www.rajapack.no/" target="_blank">Rajapack</a>
        </li>
        <li>
          <a href="https://mytnt.tnt.com/?locale=no_NO#/sign-in" target="_blank">TNT</a>
        </li>
        <li>
          <i className="fa-solid fa-ellipsis-vertical m-r-3 grey hover"></i><a href="https://www.ups.com/no/no/home" target="_blank">UPS</a>
        </li>
      </ul>}
    </div>
  )
}

export default Links