import React, { useEffect, useState } from "react";

import CSS from "csstype";
import BoggleBoard from "../../components/BoggleBoard/BoggleBoard";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import TextCountdown from "../../components/TextCountdown/TextCountdown";
import { Typography } from "@mui/material";
import DefaultBoard from "../../components/BoggleBoard/DefaultBoard";
import WordListTab from "../../components/WordListTab/WordListTab";

const PracticeScreen: React.FC<PracticeScreenProps> = ({ setScreen }) => {
  const [count, setCount] = useState(3);
  const [time, setTime] = useState(10);
  const [word, setWord] = useState(' ');
  
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight)
    const timer = setInterval(() => {
      setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div style={containerStyle}>
      {count !== 0 ? (
        <ScreenCountDown count={count} />
      ) : (
        <>
          <TextCountdown count={time} setCount={setTime} />
          <Typography variant="h4" align="center" style={{
              minHeight: '8vh', // Set a minimum height to maintain space
              display: word ? 'block' : 'none', // Show or hide based on 'word' presence
            }}> {word}
          </Typography>
          {time !== 0 ? <BoggleBoard letters={letters} setWord={setWord}></BoggleBoard> : <DefaultBoard />}
          <WordListTab players={DummyPlayers}/>
        </>
      )}
    </div>
  );
};

export default PracticeScreen;

interface PracticeScreenProps {
  setScreen: (value: number) => void;
}

const containerStyle: CSS.Properties = {
  maxHeight: "100vh", // Set the height of the parent container to full viewport height
  width: "100%",
  position: "relative",
  backgroundColor: "#282c34",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "calc(10px + 2vmin)",
  color: "white",
  overflow: 'hidden'
};

const letters = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
];

const DummyPlayers={
  'test1': letters,
  'test2': []
}