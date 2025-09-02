import { useRef, useState } from "react";
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";

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
  db: any;
  setStickers: Dispatch<SetStateAction<any[]>>;
  isShared?: boolean;
  createdBy?: string;
  createdByName?: string;
  canEditContent?: boolean;
  canResize?: boolean;
};

const Sticker = ({
  id,
  user,
  color,
  content,
  width = 1,
  height = 1,
  row,
  col,
  onColorChange,
  onContentChange,
  onDelete,
  onResize,
  dragHandleProps,
  db,
  setStickers,
  isShared,
  createdBy,
  createdByName,
  canEditContent = true,
  canResize = true,
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
      if (!user) return;

      const sharedRef = doc(db, "notes", id.toString());
      const personalRef = doc(db, "users", user.id, "notes", id.toString());

      const displayName =
        (user as any).nickname?.trim() ||
        (user as any).name?.trim() ||
        user.username;

      // 1) Upsert the shared doc (same id)
      await setDoc(
        sharedRef,
        {
          createdBy: user.id,
          createdByName: displayName,
          id,
          color,
          content,
          width,
          height,
          placements: {
            [user.id]: { row, col },
          },
          // createdAt only on first create; updatedAt on every share
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 2) Delete the personal copy from Firestore
      await deleteDoc(personalRef);

      // 3) Convert the local item to "shared" instead of adding a new one
      setStickers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                source: "shared",
                // keep immediate placement so it stays draggable
                placements: { ...(s as any).placements, [user.id]: { row, col } },
                // createdBy for delete rules later
                createdBy: user.id,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Error sharing sticker:", err);
    }
  };

  return (
    <div className={`sticker-inside ${isShared ? "sticker--shared" : `sticker-${color}`}`}>
      <div className="sticker-headline">

        {isShared && (
          <div className="sticker-shared-by">
            Shared by {createdByName || "Unknown"}
          </div>
        )}

        <div className="drag-handle" {...dragHandleProps}></div>

        {canEditContent && <div className="sticker-icons">
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
        </div>}
      </div>

      {isEditing && canEditContent ? (
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
      {canResize && <div className="resize-controls right">
        <i
          className="fa-solid fa-arrows-left-right sticker-icon hover"
          onClick={increaseWidth}
        ></i>
        <i
          className="fa-solid fa-minus sticker-icon hover"
          onClick={decreaseWidth}
        ></i>
      </div>}

      {/* Height controls on the bottom */}
      {canEditContent && <div className="resize-controls bottom">
        <i
          className="fa-solid fa-arrows-up-down sticker-icon hover"
          onClick={increaseHeight}
        ></i>
        <i
          className="fa-solid fa-minus sticker-icon hover"
          onClick={decreaseHeight}
        ></i>
      </div>}
    </div>
  );
};

export default Sticker;
