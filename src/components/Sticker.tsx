import { useEffect, useRef, useState } from "react";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { Dispatch, SetStateAction } from "react";

type StickerColor = "default" | "yellow" | "blue" | "red" | "green";

type StickerProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
  id: number;
  color: StickerColor;
  content: string;
  width?: number;
  height?: number;
  row: number;
  col: number;
  onColorChange: (color: StickerColor) => void; // choose a color from dropdown
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
  canChangeColor?: boolean;
};

const COLORS: StickerColor[] = ["default", "yellow", "blue", "red", "green"];

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
  createdByName,
  canEditContent = true,
  canResize = true,
  canChangeColor = true,
}: StickerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // palette dropdown state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeOnOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsPaletteOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const increaseWidth = () => onResize?.(width + 1, height);
  const decreaseWidth = () => onResize?.(Math.max(1, width - 1), height);
  const increaseHeight = () => onResize?.(width, height + 1);
  const decreaseHeight = () => onResize?.(width, Math.max(1, height - 1));

  /** Parse simple BBCode into HTML */
  function parseBBCode(text: string): string {
    return text
      .replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\](.*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\](.*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\n/g, "<br />");
  }

  /** Handle keyboard shortcuts inside textarea */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    let tag: "b" | "i" | "u" | null = null;
    const k = e.key.toLowerCase();
    if (k === "b") tag = "b";
    if (k === "i") tag = "i";
    if (k === "u") tag = "u";

    if (tag && textareaRef.current) {
      e.preventDefault();
      const el = textareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = content.substring(start, end);
      const next = `${content.substring(0, start)}[${tag}]${selected}[/${tag}]${content.substring(
        end
      )}`;
      onContentChange(next);
      setTimeout(() => {
        el.selectionStart = start + tag!.length + 2;
        el.selectionEnd = end + tag!.length + 2;
      }, 0);
    }
  };

  const shareSticker = async () => {
    try {
      if (!user) return;

      const sharedRef = doc(db, "notes", id.toString());
      const personalRef = doc(db, "users", user.id, "notes", id.toString());

      const displayName =
        (user as any).nickname?.trim() || (user as any).name?.trim() || user.username;

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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await deleteDoc(personalRef);

      setStickers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                source: "shared",
                placements: { ...(s as any).placements, [user.id]: { row, col } },
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
        {isShared && <div className="sticker-shared-by">Shared by {createdByName || "Unknown"}</div>}

        <div className="drag-handle" {...dragHandleProps} />

        {canEditContent && (
          <div className="sticker-icons">
            {!isShared && (
              <i className="fa-solid fa-share sticker-icon" onClick={shareSticker} />
            )}

            <div ref={paletteRef} style={{ position: "relative"}}>
              <i
                className={`fa-solid fa-palette sticker-icon ${!canChangeColor ? "disabled" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canChangeColor) setIsPaletteOpen((v) => !v);
                }}
                title="Choose color"
                aria-haspopup="menu"
                aria-expanded={isPaletteOpen}
              />

              {/* Color dropdown */}
              {isPaletteOpen && (
                <div className="color-dropdown" role="menu" style={{ right: 0 }}>
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      className={`dropdown-item hover-border`}
                      role="menuitem"
                      onClick={() => {
                        onColorChange(c);
                        setIsPaletteOpen(false);
                      }}
                    >
                      <div className={`color-dropdown-preview sticker-${c}`}>
                        <span className="preview-text">NOTE</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <i className="fa-solid fa-trash sticker-icon" onClick={() => onDelete(id)} />

          </div>
        )}
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
          onClick={() => canEditContent && setIsEditing(true)}
        />
      )}

      {/* Width controls on the right */}
      {canResize && (
        <div className="resize-controls right">
          <i className="fa-solid fa-arrows-left-right sticker-icon hover" onClick={increaseWidth} />
          <i className="fa-solid fa-minus sticker-icon hover" onClick={decreaseWidth} />
        </div>
      )}

      {/* Height controls on the bottom */}
      {canResize && (
        <div className="resize-controls bottom">
          <i className="fa-solid fa-arrows-up-down sticker-icon hover" onClick={increaseHeight} />
          <i className="fa-solid fa-minus sticker-icon hover" onClick={decreaseHeight} />
        </div>
      )}
    </div>
  );
};

export default Sticker;
