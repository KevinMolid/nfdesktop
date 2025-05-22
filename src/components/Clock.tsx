import { useEffect, useState } from "react";

const Clock = () => {
  const [time, setTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  const getTime = () => {
    const hrs = time.getHours().toString().padStart(2, "0");
    const mins = time.getMinutes().toString().padStart(2, "0");
    const secs = time.getSeconds().toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  return <div className="clock">{getTime()}</div>;
};

export default Clock;
