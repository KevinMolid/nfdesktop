type MessageProps = {
  message: string;
  setMessage: (value: string) => void;
};

const Message = ({message, setMessage }: MessageProps) => {
  return (
    <div className="card message-container">
      <button
        onClick={() => setMessage("")}
        className="close-button-msg"
      >
        <i className="fa-solid fa-x"></i>
      </button>
      <p>{message}</p>
    </div>
  )
}

export default Message