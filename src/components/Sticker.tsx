import { useRef, useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

type StickerProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
  id: number;
  color: string;
  content: string;
  width?: number;
  height?: number;
  row: number;
  col: number;
  onColorChange: () => void;
  onContentChange: (content: string) => void;
  onDelete: (id: number) => void;
  onResize?: (width: number, height: number) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
};

const Sticker = ({
  id,
  user,
  color,
  content,
  width = 1,
  height = 1,
  onColorChange,
  onContentChange,
  onDelete,
  onResize,
  dragHandleProps,
}: StickerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const increaseWidth = () => {
    if (onResize) onResize(width + 1, height);
  };

  const decreaseWidth = () => {
    if (onResize) onResize(Math.max(1, width - 1), height);
  };

  const increaseHeight = () => {
    if (onResize) onResize(width, height + 1);
  };

  const decreaseHeight = () => {
    if (onResize) onResize(width, Math.max(1, height - 1));
  };

  /** Parse simple BBCode into HTML */
  function parseBBCode(text: string): string {
    return text
      .replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\](.*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\](.*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\n/g, "<br />"); // preserve line breaks
  }

  /** Handle keyboard shortcuts inside textarea */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return; // Only trigger with CTRL (or CMD on Mac)

    let tag: string | null = null;
    if (e.key.toLowerCase() === "b") tag = "b";
    if (e.key.toLowerCase() === "i") tag = "i";
    if (e.key.toLowerCase() === "u") tag = "u";

    if (tag && textareaRef.current) {
      e.preventDefault();
      const el = textareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selectedText = content.substring(start, end);

      const before = content.substring(0, start);
      const after = content.substring(end);

      const newText = `${before}[${tag}]${selectedText}[/${tag}]${after}`;
      onContentChange(newText);

      // Reselect the wrapped text
      setTimeout(() => {
        el.selectionStart = start + tag.length + 2;
        el.selectionEnd = end + tag.length + 2;
      }, 0);
    }
  };

  const shareSticker = async () => {
    try {
      if (!user) {
        console.error("User not logged in.");
        return;
      }

      await addDoc(collection(db, "notes"), {
        createdBy: user.id,
        color,
        content,
        width,
        height,
        createdAt: serverTimestamp(),
      });

      console.log("Sticker shared to Firestore!");
    } catch (err) {
      console.error("Error sharing sticker:", err);
    }
  };

  return (
    <div className={`sticker-inside sticker-${color}`}>
      <div className="sticker-headline">
        <div className="drag-handle" {...dragHandleProps}></div>
        <div className="sticker-icons">
          <i
            className="fa-solid fa-share sticker-icon"
            onClick={shareSticker}
          />
          <i
            className="fa-solid fa-palette sticker-icon"
            onClick={onColorChange}
          ></i>
          <i
            className="fa-solid fa-trash sticker-icon"
            onClick={() => onDelete(id)}
          ></i>
        </div>
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="sticker-textarea"
          spellCheck={false}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div
          className="sticker-content"
          dangerouslySetInnerHTML={{ __html: parseBBCode(content) }}
          onClick={() => setIsEditing(true)}
        />
      )}

      {/* Width controls on the right */}
      <div className="resize-controls right">
        <i
          className="fa-solid fa-arrows-left-right sticker-icon hover"
          onClick={increaseWidth}
        ></i>
        <i
          className="fa-solid fa-minus sticker-icon hover"
          onClick={decreaseWidth}
        ></i>
      </div>

      {/* Height controls on the bottom */}
      <div className="resize-controls bottom">
        <i
          className="fa-solid fa-arrows-up-down sticker-icon hover"
          onClick={increaseHeight}
        ></i>
        <i
          className="fa-solid fa-minus sticker-icon hover"
          onClick={decreaseHeight}
        ></i>
      </div>
    </div>
  );
};

export default Sticker;
