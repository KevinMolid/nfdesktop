import { useEffect, useState } from "react";
import avatar from "../assets/defaultAvatar.png";

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

type UserInfo = {
  displayName: string;
  imgUrl?: string;
};

type UserMap = Record<string, UserInfo>;

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
  const [usersMap, setUsersMap] = useState<UserMap>({});

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
      const map: Record<string, UserInfo> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const username = data.username;
        const nickname = data.nickname?.trim();
        const name = data.name?.trim();
        map[username] = {
          displayName: nickname || name || username,
          imgUrl: data.imgurl || null, // 👈 check for imgurl in DB
        };
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
    <div className="container">
      <div className="page-header">
        <h1>Chat</h1>
      </div>

      <div className="card messages-container">
        {messages.map((msg: any) => {
          const date: Date | null = msg.createdAt?.toDate?.() || null;

          return (
            <div key={msg.id} className="message-wrapper">
              {msg.sender !== username && (
                <img
                  className="avatar"
                  src={usersMap[msg.sender]?.imgUrl || avatar}
                  alt="user-img"
                />
              )}
              <div
                className={`message ${
                  msg.sender === username ? "user-msg" : ""
                }`}
              >
                <p className="message-info">
                  {msg.sender !== username && (
                    <strong className="user">
                      {usersMap[msg.sender]?.displayName || msg.sender}
                    </strong>
                  )}
                  <small className="message-timestamp">
                    {date ? formatTimestamp(date) : "Sender..."}
                  </small>
                </p>
                <p className="message-content">{msg.content}</p>
              </div>
              {msg.sender === username && (
                <img
                  className="avatar"
                  src={usersMap[msg.sender]?.imgUrl || avatar}
                  alt="user-img"
                />
              )}
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
