import React, { useEffect, useState } from "react";

import CSS from "csstype";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import { Button, Stack, Typography } from "@mui/material";
import WordListTab from "../../components/WordListTab/WordListTab";
import { Players, Solutions, StageEnum, Words } from "../core";
import DefaultBoard from "../../components/BoggleBoard/DefaultBoard";
import { useNavigate } from "react-router-dom";
import { YOUR_NAME } from "../../constants";
import { socket } from "../..";

const VersusResultStage: React.FC<VersusResultStageProps> = ({
  setStage,
  players,
  letters,
  solutions,
}) => {
  const [count, setCount] = useState(3);

  const navigate = useNavigate();
  const isInSolution = (word: string) => {
    const sortedWord = word.split("").sort().join("");

    return solutions[sortedWord]?.includes(word);
  };
  const countScore = (player: Words[]) => {
    return player.reduce((res, cur) => {
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
      return isInSolution(cur.word) ? res + score[0] : res + score[-1];
    }, 0);
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

  return (
    <div style={containerStyle}>
      {count !== 0 ? (
        <ScreenCountDown title={"Result!"} count={count} />
      ) : (
        <>
          <Typography
            variant="h4"
            align="center"
            style={{
              minHeight: "8vh", // Set a minimum height to maintain space
              display: "block", // Show or hide based on 'word' presence
            }}
          >
            Results
          </Typography>
          <Stack
            direction={"row"}
            justifyContent="space-between"
            sx={{ width: "70%", marginTop: "1vh", marginBottom: "2vh" }}
          >
            <Typography variant="h6" align="center" sx={{ fontSize: "1rem" }}>
              Score: {countScore(players[YOUR_NAME])}
            </Typography>
            <Stack direction={"row"} spacing={1}>
              <Button
                style={{
                  backgroundColor: "grey",
                  fontSize: "0.5rem",
                }}
                variant="contained"
                onClick={() => {
                  socket.emit("game:end_room");
                  navigate("/");
                }}
              >
                Main Menu
              </Button>
              <Button
                style={{
                  backgroundColor: "grey",
                  fontSize: "0.5rem",
                }}
                variant="contained"
                onClick={() => {
                  socket.emit("game:end_room");
                  setStage(StageEnum.PLAY);
                }}
              >
                Play again
              </Button>
            </Stack>
          </Stack>
          <DefaultBoard inputLetters={letters} />
          <WordListTab players={players} solutions={solutions} />
        </>
      )}
    </div>
  );
};

export default VersusResultStage;

interface VersusResultStageProps {
  solutions: Solutions;
  setStage: (value: number) => void;
  players: Players;
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
  textAlign: "center",
};
