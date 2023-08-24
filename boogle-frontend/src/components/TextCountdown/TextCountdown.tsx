import React, { useEffect } from "react";
import { Stack, Typography } from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/AccessTime";
import "./TextCountdown.css";

const TextCountdown: React.FC<TextCountdownProps> = ({ count, setCount }) => {
  useEffect(() => {
    if (count > 0) {
      const timer = setInterval(() => {
        setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 0));
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [count]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
    return seconds;
  };

  return (
    <Stack spacing={4} direction={"row"} className="countdown-container">
      <HourglassEmptyIcon fontSize="large" />
      <Typography className="countdown-text" variant="h2">
        {formatTime(count)}
      </Typography>
    </Stack>
  );
};

interface TextCountdownProps {
  count: number;
  setCount: React.Dispatch<React.SetStateAction<number>>;
}

export default TextCountdown;
