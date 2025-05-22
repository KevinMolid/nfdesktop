const Clock = () => {
    const time = new Date();

    const getTime = () => {
      let hrs = time.getHours().toString()
      let mins = time.getMinutes().toString()
      let secs = time.getSeconds().toString()
      if (hrs in [0,1,2,3,4,5,6,7,8,9]){
        hrs = "0"+hrs
      }
      if (mins in [0,1,2,3,4,5,6,7,8,9]){
        mins = "0"+mins
      }

      return hrs + ":" + mins + ":" + secs
    }

  return (
    <div className="clock">
      {getTime()}
    </div>
  )
}

export default Clock