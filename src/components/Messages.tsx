import { useEffect, useState } from "react";
import {
  query,
  collection,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  differenceInHours,
  isYesterday,
  format,
  formatDistanceToNow,
} from "date-fns";

type MessagesProps = {
  username: string;
  toggleActive: (name: string) => void;
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);

  if (hoursAgo < 24) {
    return formatDistanceToNow(date, {
      addSuffix: true, // uses default (English)
    });
  }

  if (isYesterday(date)) {
    return format(date, "'Yesterday' HH:mm");
  }

  const daysAgo = Math.floor(hoursAgo / 24);

  if (daysAgo < 30) {
    return formatDistanceToNow(date, {
      addSuffix: true,
    }); // "12 dager siden"
  }

  return format(date, "d. MMMM yyyy - HH:mm");
};

const Messages = ({ username, toggleActive }: MessagesProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Query messages in order of creation time
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data);
      },
      (error) => {
        console.error("Error with real-time listener:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  /* Fetch users data */
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const username = data.username;
        const nickname = data.nickname?.trim();
        const name = data.name?.trim();
        map[username] = nickname || name || username; // fallback
      });
      setUsersMap(map);
    });

    return () => unsubscribe();
  }, []);

  /* Send message */
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
        <h3 className="card-title">Chat</h3>
      </div>

      <div className="messages-container">
        {messages.map((msg: any) => {
          const date: Date | null = msg.createdAt?.toDate?.() || null;

          return (
            <div key={msg.id}>
              <div
                className={`message ${
                  msg.sender === username ? "user-msg" : ""
                }`}
              >
                <p className="message-info">
                  {msg.sender !== username && (
                    <strong className="user">
                      {usersMap[msg.sender] || msg.sender}
                    </strong>
                  )}
                  <small className="message-timestamp">
                    {date ? formatTimestamp(date) : "Sender..."}
                  </small>
                </p>
                <p className="message-content">{msg.content}</p>
              </div>
            </div>
          );
        })}
      </div>

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
