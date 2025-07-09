import { useRef } from "react";

type StickerProps = {
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
  color,
  content,
  width = 1,
  height = 1,
  onColorChange,
  onContentChange,
  onDelete,
  onResize,
  dragHandleProps
}: StickerProps) => {
  const date = new Date(id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className={`sticker-inside sticker-${color}`}>
      <div className="sticker-headline">
        <div className="drag-handle" {...dragHandleProps}>
        </div>
        <div className="sticker-icons">
          <i className="fa-solid fa-palette sticker-icon hover" onClick={onColorChange}></i>
          <i className="fa-solid fa-trash sticker-icon hover" onClick={() => onDelete(id)}></i>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="sticker-textarea"
        spellCheck={false}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />

      {/* Width controls on the right */}
      <div className="resize-controls right">
        <i className="fa-solid fa-arrows-left-right sticker-icon hover" onClick={increaseWidth}></i>
        <i className="fa-solid fa-minus sticker-icon hover" onClick={decreaseWidth}></i>
      </div>

      {/* Height controls on the bottom */}
      <div className="resize-controls bottom">
        <i className="fa-solid fa-arrows-up-down sticker-icon hover" onClick={increaseHeight}></i>
        <i className="fa-solid fa-minus sticker-icon hover" onClick={decreaseHeight}></i>
      </div>
    </div>
  );
};

export default Sticker;
