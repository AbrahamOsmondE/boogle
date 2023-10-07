import React, { useEffect, useState } from "react";

import CSS from "csstype";
import TextCountdown from "../../components/TextCountdown/TextCountdown";
import { Button, Stack, Typography } from "@mui/material";
import { Players, StageEnum, Words } from "../core";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import { OPPONENTS_NAME } from "../../constants";
import { socket } from "../..";
import WordListTabChallenge from "../../components/WordListTab/WordListTabChallenge";
import { useAppSelector } from "../../app/hooks";
import { selectGlobalTimeLeft } from "../../redux/features/globalSlice";

const VersusChallengeStage: React.FC<VersusChallengeStageProps> = ({
  setStage,
  players,
  setPlayers,
}) => {
  const [count, setCount] = useState(3);
  const [time, setTime] = useState(useAppSelector(selectGlobalTimeLeft));

  const userId = localStorage.getItem("userId");
  const roomCode = localStorage.getItem("roomCode");

  const isInSolution = (word: string) => {
    return players["solutions"]?.some((wordObj) => wordObj.word === word);
  };
  const countScore = (player: Words[]) => {
    return player?.reduce((res, cur) => {
      if (!cur.checked) return res;
      const wordLength = cur.word.length;
      let score = [0, 0];

      if (wordLength >= 8) {
        score = [5, -4];
      } else if (wordLength >= 7) {
        score = [4, -3];
      } else if (wordLength >= 6) {
        score = [3, -2];
      } else if (wordLength >= 5) {
        score = [2, -1];
      } else if (wordLength >= 3) {
        score = [1, -1];
      }
      return isInSolution(cur.word) ? res + score[0] : res + score[1];
    }, 0);
  };

  const updateChecked = (word: string, status: boolean) => {
    const key = `${userId}_challenge`;
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
      const words = players[OPPONENTS_NAME].filter((val) => val.checked).map(
        (wordObj) => wordObj.word,
      );
      const stage = localStorage.getItem("stage") ?? "0";
      const nextStage = parseInt(stage) + 1;
      localStorage.setItem("stage", nextStage.toString());
      socket.emit("game:next_round", {
        userId,
        roomCode,
        words,
        stage: parseInt(stage),
      });
      socket.emit("game:go_to_next_round", { roomCode, stage: nextStage });
      setStage(StageEnum.WAIT);
    }
  }, [time]);

  return (
    <div style={containerStyle}>
      {count !== 0 ? (
        <ScreenCountDown title={"Challenge!"} count={count} />
      ) : (
        <>
          <TextCountdown count={time} setCount={setTime} />
          <Stack
            direction={"row"}
            justifyContent="space-between"
            sx={{ width: "70%", marginTop: "1vh", marginBottom: "2vh" }}
          >
            <Typography variant="h6" align="center">
              Score: {countScore(players[OPPONENTS_NAME])}
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
          <WordListTabChallenge
            players={{ [OPPONENTS_NAME]: players[OPPONENTS_NAME] }}
            setPlayers={setPlayers}
            updateChecked={updateChecked}
          />
        </>
      )}
    </div>
  );
};

export default VersusChallengeStage;

interface VersusChallengeStageProps {
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
