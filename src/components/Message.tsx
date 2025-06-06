type MessageProps = {
  message: string;
};

const Message = ({message}: MessageProps) => {
  return (
    <div className="card message-container">
        <p>{message}</p>
    </div>
  )
}

export default Message