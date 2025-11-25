type NatoProps = {
  toggleActive: (name: string) => void;
};

const NatoAlphabet = ({ toggleActive }: NatoProps) => {
  const alphabet = [
    { letter: "A", word: "Alpha" },
    { letter: "B", word: "Bravo" },
    { letter: "C", word: "Charlie" },
    { letter: "D", word: "Delta" },
    { letter: "E", word: "Echo" },
    { letter: "F", word: "Foxtrot" },
    { letter: "G", word: "Golf" },
    { letter: "H", word: "Hotel" },
    { letter: "I", word: "India" },
    { letter: "J", word: "Juliet" },
    { letter: "K", word: "Kilo" },
    { letter: "L", word: "Lima" },
    { letter: "M", word: "Mike" },
    { letter: "N", word: "November" },
    { letter: "O", word: "Oscar" },
    { letter: "P", word: "Papa" },
    { letter: "Q", word: "Quebec" },
    { letter: "R", word: "Romeo" },
    { letter: "S", word: "Sierra" },
    { letter: "T", word: "Tango" },
    { letter: "U", word: "Uniform" },
    { letter: "V", word: "Victor" },
    { letter: "W", word: "Whiskey" },
    { letter: "X", word: "Xray" },
    { letter: "Y", word: "Yankee" },
    { letter: "Z", word: "Zulu" },
  ];

  return (
    <div className="card has-header grow">
      <div className="card-header">
        <h3 className="card-title">Nato alphabet</h3>
      </div>
      <div className="flex gap-1 flex-wrap">
        {alphabet.map((i) => {
          return (
            <div key={i.word} className="bg-(--main-bg-color) p-3 md:p-4 basis-1/8 
              grow flex flex-col justify-center text-center">
              <p className="nato-letter">{i.letter}</p>
              <p className="text-sm">{i.word}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NatoAlphabet;
