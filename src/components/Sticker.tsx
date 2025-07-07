import { useRef, useState, useEffect } from "react";

type StickerProps = {
  id: number;
  color: string;
  content: string;
  width?: number;
  height?: number;
  onColorChange: () => void;
  onContentChange: (content: string) => void;
  onDelete: (id: number) => void;
  onResize?: (width: number, height: number) => void;
};

const Sticker = ({ id, color, content, width = 1, height = 1, onColorChange, onContentChange, onDelete, onResize }: StickerProps) => {
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

  const baseSize = 1;
  const stickerStyle = {
    gridColumn: `span ${width}`,
    gridRow: `span ${height}`,
  };

  return (
    <div
      className={`sticker sticker-${color}`}
      style={stickerStyle}
    >
      <div className="sticker-headline">
        <p>{`${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`}</p>
        <div className="sticker-icons">

          <i className="fa-solid fa-plus sticker-icon hover" onClick={increaseWidth}></i>
          <i className="fa-solid fa-minus sticker-icon hover" onClick={decreaseWidth}></i>
          <i className="fa-solid fa-plus sticker-icon hover" onClick={increaseHeight}></i>
          <i className="fa-solid fa-minus sticker-icon hover" onClick={decreaseHeight}></i>
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
