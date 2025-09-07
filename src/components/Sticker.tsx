import { useRef, useState, Dispatch, SetStateAction } from "react";

type StickerColor = "default" | "yellow" | "blue" | "red" | "green";

type Audience = {
  everyone?: boolean;
  userIds?: string[];
  groupIds?: string[];
};

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

  // actions
  onColorChange: (color: StickerColor) => void;
  onContentChange: (content: string) => void;
  onDelete: () => void; // <- no arg; DragableSticker passes () => void
  onResize?: (width: number, height: number) => void;
  onOpenShare?: () => void; // <- open the share modal (from Notes)

  // drag
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;

  // kept for compatibility (not used here)
  db: any;
  setStickers: Dispatch<SetStateAction<any[]>>;

  // shared meta
  isShared?: boolean;
  createdBy?: string;
  createdByName?: string;

  // audience display (precomputed label from Notes)
  share?: Audience;
  shareLabel?: string;

  // perms
  canEditContent?: boolean;
  canResize?: boolean;
  canChangeColor?: boolean;
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
  isShared,
  createdBy,
  createdByName,
  share,
  canEditContent = true,
  canResize = true,
  canChangeColor = true,
  onOpenShare,
  shareLabel,
}: StickerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  /** CTRL/CMD + B/I/U for BBCode */
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
      const before = content.substring(0, start);
      const sel = content.substring(start, end);
      const after = content.substring(end);
      const next = `${before}[${tag}]${sel}[/${tag}]${after}`;
      onContentChange(next);
      setTimeout(() => {
        el.selectionStart = start + tag!.length + 2;
        el.selectionEnd = end + tag!.length + 2;
      }, 0);
    }
  };

  return (
    <div
      className={`sticker-inside ${
        isShared ? "sticker--shared" : `sticker-${color}`
      }`}
    >
      <div className="sticker-headline">
        {isShared && (
          <div className="sticker-shared-by">
            {createdBy === user.id
              ? `Shared with ${shareLabel ?? "everyone"}`
              : `Shared by ${createdByName || "Unknown"}`}
          </div>
        )}

        <div className="drag-handle" {...dragHandleProps} />

        {canEditContent && (
          <div className="sticker-icons">
            {/* OPEN THE MODAL IN NOTES, DO NOT SHARE IMMEDIATELY */}
            <i
              className="fa-solid fa-share sticker-icon"
              onClick={onOpenShare}
              title="Share"
              role="button"
            />
            {canChangeColor && (
              <i
                className="fa-solid fa-palette sticker-icon"
                onClick={() => onColorChange(color)}
                title="Change color"
                role="button"
              />
            )}
            <i
              className="fa-solid fa-trash sticker-icon"
              onClick={onDelete}
              title="Delete"
              role="button"
            />
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
          onClick={() => setIsEditing(true)}
        />
      )}

      {canResize && (
        <div className="resize-controls right">
          <i
            className="fa-solid fa-arrows-left-right sticker-icon hover"
            onClick={increaseWidth}
          />
          <i
            className="fa-solid fa-minus sticker-icon hover"
            onClick={decreaseWidth}
          />
        </div>
      )}

      {canResize && (
        <div className="resize-controls bottom">
          <i
            className="fa-solid fa-arrows-up-down sticker-icon hover"
            onClick={increaseHeight}
          />
          <i
            className="fa-solid fa-minus sticker-icon hover"
            onClick={decreaseHeight}
          />
        </div>
      )}
    </div>
  );
};

export default Sticker;
