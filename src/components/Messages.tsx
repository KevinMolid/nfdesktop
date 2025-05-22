const Messages = () => {
  return (
    <div className="card has-header grow-1">
        <div className="card-header">
            <h3 className="card-title">Meldinger</h3>
            <i className="fa-solid fa-plus blue icon-md hover"></i>
        </div>
        <div className="message">
            <p className="message-info"><strong className="user">Erlend Bakke</strong><small className="message-timestamp">19.05.2025 kl 09:23</small></p>
            <p>Propeller til LT-tech må pakkes og sendes i dag!</p>
        </div>
    </div>
  )
}

export default Messages