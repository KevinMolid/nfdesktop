const Dateline = () => {
    const time = new Date();

    const getDate = () => {
        const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"]
        const months = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"]
        const day = days[time.getDay()]
        const date = time.getDate()
        const month = months[time.getMonth()]
        const year = time.getFullYear()

      return day + " " + date + ". " + month + " " + year
    }

  return (
    <div className="clock">
      {getDate()}
    </div>
  )
}

export default Dateline