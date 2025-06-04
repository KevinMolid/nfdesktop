import { useEffect, useState } from "react";
import { query, collection, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

type MessagesProps = {
  username: string;
};

const Messages = ({ username }: MessagesProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Query messages in order of creation time
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    }, (error) => {
      console.error("Error with real-time listener:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "messages"), {
        sender: username,
        content: newMessage,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Meldinger</h3>
      </div>

      {messages.map((msg: any) => (
        <div key={msg.id}>
          <div className="message">
            <p className="message-info">
              <strong className="user">{msg.sender}</strong>
              <small className="message-timestamp">
                {msg.createdAt?.toDate().toLocaleString() || "Sending..."}
              </small>
            </p>
            <p>{msg.content}</p>
          </div>
        </div>
      ))}

      <div className="message-input-container">
        <textarea
          className="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button className="message-btn" onClick={handleSend}>
          <i className="fa-solid fa-paper-plane m-r-1"></i> Send
        </button>
      </div>
    </div>
  );
};

export default Messages;
