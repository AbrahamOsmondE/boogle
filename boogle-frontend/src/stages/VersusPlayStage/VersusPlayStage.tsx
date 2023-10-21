import React, { useEffect, useState } from "react";

import CSS from "csstype";
import BoggleBoard from "../../components/BoggleBoard/BoggleBoard";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import TextCountdown from "../../components/TextCountdown/TextCountdown";
import { Typography } from "@mui/material";
import { Players, StageEnum } from "../core";
import DefaultBoard from "../../components/BoggleBoard/DefaultBoard";
import { socket } from "../..";
import { YOUR_NAME } from "../../constants";
import { Words } from "../core";
import { useAppSelector } from "../../app/hooks";
import { selectGlobalTimeLeft } from "../../redux/features/globalSlice";

const VersusPlayStage: React.FC<VersusPlayStageProps> = ({
  setStage,
  players,
  setPlayers,
  letters,
}) => {
  const [count, setCount] = useState(3);
  const [time, setTime] = useState(useAppSelector(selectGlobalTimeLeft));
  const [word, setWord] = useState(" ");
  const userId = localStorage.getItem("userId");
  const roomCode = localStorage.getItem("roomCode");

  const sendWord = (word: string) => {
    socket.emit("game:append_word", { roomCode, userId, word });
  };

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
    const timer = setInterval(() => {
      setCount((prevCount) => (prevCount > 1 ? prevCount - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const timeLeft = useAppSelector(selectGlobalTimeLeft);
  useEffect(() => {
    setTime(timeLeft);
  }, [timeLeft]);
  useEffect(() => {
    if (time === 0) {
      const words = players[YOUR_NAME].map((word: Words) => word.word);
      setWord("TIMES UP!");
      const timer = setTimeout(() => {
        const storedStage = localStorage.getItem("stage") ?? "0";
        const stage = parseInt(storedStage);
        const nextStage = stage + 1;
        localStorage.setItem("stage", nextStage.toString());

        socket.emit("game:go_to_next_round", {
          roomCode,
          stage: stage,
          words,
          userId,
        });
        setStage(StageEnum.WAIT);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [time]);

  return (
    <div style={containerStyle}>
      {count !== 0 ? (
        <ScreenCountDown title={"Boggle!"} count={count} />
      ) : (
        <>
          <TextCountdown count={time} setCount={setTime} />
          <Typography
            variant="h4"
            align="center"
            style={{
              minHeight: "8vh", // Set a minimum height to maintain space
              display: word ? "block" : "none", // Show or hide based on 'word' presence
            }}
          >
            {word}
          </Typography>
          {time !== 0 ? (
            <BoggleBoard
              letters={letters}
              setWord={setWord}
              players={players}
              setPlayers={setPlayers}
              sendWord={sendWord}
            ></BoggleBoard>
          ) : (
            <DefaultBoard />
          )}
        </>
      )}
    </div>
  );
};

export default VersusPlayStage;

interface VersusPlayStageProps {
  setStage: (value: number) => void;
  players: Players;
  setPlayers: (value: Players) => void;
  letters: string[];
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
  overflow: "hidden",
};
