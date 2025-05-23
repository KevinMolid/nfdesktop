import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

const Messages = () => {
  const [messages, setMessages] = useState<any>([])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "messages"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(data);
    }, (error) => {
      console.error("Error with real-time listener:", error);
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="card has-header grow-1">
        <div className="card-header">
            <h3 className="card-title">Meldinger</h3>
        </div>
        
      {messages.map((msg: any) => (
        <div key={msg.id}>
          <div className="message">
            <p className="message-info"><strong className="user">{msg.sender}</strong><small className="message-timestamp">19.05.2025 kl 09:23</small></p>
            <p>{msg.content}</p>
          </div>
        </div>
      ))}

        <div className="message-input-container">
          <textarea className="message-input"/>
          <button className="message-btn"><i className="fa-solid fa-paper-plane m-r-1"></i> Send</button>
        </div>
    </div>
  )
}

export default Messages