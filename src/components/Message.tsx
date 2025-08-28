type MessageProps = {
  message: {
    text: string;
    type: "success" | "error" | "info" | "warning" | "";
  };
  setMessage: React.Dispatch<
    React.SetStateAction<{
      text: string;
      type: "success" | "error" | "info" | "warning" | "";
    }>
  >;
};

const Message = ({ message, setMessage }: MessageProps) => {
  return (
    <div className={`message-container message-${message.type}`}>
      <button
        onClick={() => setMessage({ text: "", type: "" })}
        className="close-button-msg"
      >
        <i className="fa-solid fa-x"></i>
      </button>
      <p>{message.text}</p>
    </div>
  );
};

export default Message;
