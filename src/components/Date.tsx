const Dateline = () => {
    const time = new Date();

    const getDate = () => {
        const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"]
        const day = days[time.getDay()]
        const date = time.getDate()
        const month = time.getMonth() + 1
        const year = time.getFullYear()

      return day + " " + date + "." + month + "." + year
    }

  return (
    <div className="clock"><i className="fa-solid fa-calendar lightgrey"></i>
{getDate()}</div>
  )
}

export default Dateline