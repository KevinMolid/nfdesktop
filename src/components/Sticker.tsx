import { useRef, useState, useEffect } from "react";

type StickerProps = {
  id: number;
  color: string;
  content: string;
  onColorChange: () => void;
  onContentChange: (content: string) => void;
  onDelete: (id: number) => void;
};

const Sticker = ({ id, color, content, onColorChange, onContentChange, onDelete }: StickerProps) => {
  const date = new Date(id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const testOverflow = (width: number) => {
      el.style.width = `${width}px`;
      const overflowing = el.scrollHeight > el.clientHeight;
      return overflowing;
    };

    const needsMoreSpace = testOverflow(400);
    if (needsMoreSpace) {
      setIsWide(true);
    } else {
      const fitsInNarrow = !testOverflow(200);
      setIsWide(!fitsInNarrow);
    }

    // ✅ Clear inline width override to let CSS 100% take over
    el.style.width = "";
  }, [content]);


  return (
    <div
      className={`sticker sticker-${color}`}
      style={{ width: isWide ? 400 : 240 }}
    >
      <div className="sticker-headline">
        <p>{`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}</p>
        <div className="sticker-icons">
          <i className="fa-solid fa-arrow-left sticker-icon hover" onClick={() => console.log("left")}></i>
          <i className="fa-solid fa-arrow-right sticker-icon hover" onClick={() => console.log("right")}></i>
          <i className="fa-solid fa-palette sticker-icon hover" onClick={onColorChange}></i>
          <i className="fa-solid fa-trash sticker-icon hover" onClick={() => onDelete(id)}></i>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="sticker-textarea"
        spellCheck="false"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
    </div>
  );
};

export default Sticker;
