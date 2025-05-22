type StickerProps = {
  id: number;
  color: string;
  content: string;
  onColorChange: () => void;
  onContentChange: (content: string) => void;
  onDelete: (id: number) => void;
};

const Sticker = ({ id, color, content, onColorChange, onContentChange, onDelete }: StickerProps) => {
    const date = new Date(id)
  
    return (
    <div className={`sticker sticker-${color}`}>
        <div className="sticker-headline">
            <p>{date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear()}</p>
            <div className="sticker-icons">
                <i className="fa-solid fa-arrow-left sticker-icon hover" onClick={() => console.log("left")}></i>
                <i className="fa-solid fa-arrow-right sticker-icon hover" onClick={() => console.log("right")}></i>
                <i className="fa-solid fa-palette sticker-icon hover" onClick={() => onColorChange()}></i>
                <i className="fa-solid fa-trash sticker-icon hover" onClick={() => onDelete(id)}></i>
            </div>
            </div>
        <textarea className="sticker-textarea"
            name="" id=""
            spellCheck="false"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}></textarea>
    </div>
  )
}

export default Sticker