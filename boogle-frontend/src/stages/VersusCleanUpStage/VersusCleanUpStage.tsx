import React, { useEffect, useState } from "react";

import CSS from "csstype";
import TextCountdown from "../../components/TextCountdown/TextCountdown";
import { Button, Stack, Typography } from "@mui/material";
import WordListTabCleanUp from "../../components/WordListTab/WordListTabCleanup";
import { Players, StageEnum, Words } from "../core";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import { YOUR_NAME } from "../../constants";
import { socket } from "../..";

const VersusCleanUpStage: React.FC<VersusCleanUpStageProps> = ({
  setStage,
  players,
  setPlayers,
}) => {
  const [count, setCount] = useState(3);
  const [time, setTime] = useState(180);
  const userId = localStorage.get("userId");
  const roomCode = localStorage.get("roomCode");
  const countScore = (player: Words[]) => {
    return player.reduce((res, cur) => {
      if (!cur.checked) return res;
      const wordLength = cur.word.length;
      let score = 0;

      if (wordLength >= 8) {
        score = 5;
      } else if (wordLength >= 7) {
        score = 4;
      } else if (wordLength >= 6) {
        score = 3;
      } else if (wordLength >= 5) {
        score = 2;
      } else if (wordLength >= 3) {
        score = 1;
      }
      return res + score;
    }, 0);
  };

  const updateChecked = (word: string, status: boolean) => {
    const key = `${userId}`;
    socket.emit("game:update_word_status", { word, status, key });
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

  useEffect(() => {
    if (time === 0) {
      const words = players[YOUR_NAME].filter((val) => val.checked).map(
        (wordObj) => wordObj.word,
      );
      socket.emit("game:next_round", { userId, roomCode, words });
      setStage(StageEnum.CHALLENGE);
    }
  }, [time]);

  return (
    <div style={containerStyle}>
      {count !== 0 ? (
        <ScreenCountDown title={"Clean up!"} count={count} />
      ) : (
        <>
          <TextCountdown count={time} setCount={setTime} />
          <Stack
            direction={"row"}
            justifyContent="space-between"
            sx={{ width: "70%", marginTop: "1vh", marginBottom: "2vh" }}
          >
            <Typography variant="h6" align="center">
              Score: {countScore(players[YOUR_NAME])}
            </Typography>

            <Button
              style={{
                backgroundColor: "grey",
              }}
              variant="contained"
              onClick={() => {
                setTime(0);
              }}
            >
              Done
            </Button>
          </Stack>
          <WordListTabCleanUp
            players={players}
            setPlayers={setPlayers}
            updateChecked={updateChecked}
          />
        </>
      )}
    </div>
  );
};

export default VersusCleanUpStage;

interface VersusCleanUpStageProps {
  setStage: (value: number) => void;
  players: Players;
  setPlayers: (value: Players) => void;
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
