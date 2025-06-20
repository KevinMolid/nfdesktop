import { useEffect, useState } from "react";
import { query, collection, onSnapshot, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { differenceInHours, isYesterday, format, formatDistanceToNow } from "date-fns";
import { nb as originalNb } from "date-fns/locale";


type MessagesProps = {
  username: string;
};

// Clone and override formatDistance
const nbWithoutAbout = {
  ...originalNb,
  formatDistance: (token: string, count: number, options: any): string => {
    const original = (originalNb.formatDistance as Function)(token, count, options);
    return original.replace(/^omtrent\s+/i, "").replace(/^ca.\s+/i, "");
  },
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const hoursAgo = differenceInHours(now, date);

  if (hoursAgo < 24) {
    return formatDistanceToNow(date, { locale: nbWithoutAbout, addSuffix: true }); // "2 minutter siden"
  }

  if (isYesterday(date)) {
    return format(date, "'I går' HH:mm", { locale: nbWithoutAbout }); // "I går 16:45"
  }

  const daysAgo = Math.floor(hoursAgo / 24);

  if (daysAgo < 30) {
    return formatDistanceToNow(date, { locale: nbWithoutAbout, addSuffix: true }); // "12 dager siden"
  }

  return format(date, "d. MMM yyyy, HH:mm", { locale: nbWithoutAbout }); // "4. mai 2025, 14:25"
};

const Messages = ({ username }: MessagesProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Query messages in order of creation time
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc")
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
        <h3 className="card-title">Meldinger</h3>
      </div>

      <div className="messages-container">
        {messages.map((msg: any) => {
          const date: Date | null = msg.createdAt?.toDate?.() || null;

          return (
            <div key={msg.id}>
              <div className={`message ${msg.sender === username ? "user-msg" : ""}`}>
                <p className="message-info">
                  {msg.sender !== username && <strong className="user">{usersMap[msg.sender] || msg.sender}</strong>}
                  <small className="message-timestamp">
                    {date ? formatTimestamp(date) : "Sender..."}
                  </small>
                </p>
                <p>{msg.content}</p>
              </div>
            </div>
        )})}
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
