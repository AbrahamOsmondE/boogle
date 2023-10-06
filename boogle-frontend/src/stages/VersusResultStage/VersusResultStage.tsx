import React, { useEffect, useState } from "react";

import CSS from "csstype";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import { Button, Stack, Typography } from "@mui/material";
import WordListTab from "../../components/WordListTab/WordListTab";
import { Players, StageEnum, Words } from "../core";
import DefaultBoard from "../../components/BoggleBoard/DefaultBoard";
import { useNavigate } from "react-router-dom";
import { socket } from "../..";

const VersusResultStage: React.FC<VersusResultStageProps> = ({
  setStage,
  players,
  letters,
  solutions,
}) => {
  const [count, setCount] = useState(3);
  const [score, setScore] = useState(0);

  const userId = localStorage.getItem("userId");
  const roomCode = localStorage.getItem("roomCode");

  const navigate = useNavigate();

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
              Score: {score.toString()}
            </Typography>
            <Stack direction={"row"} spacing={1}>
              <Button
                style={{
                  backgroundColor: "grey",
                  fontSize: "0.5rem",
                }}
                variant="contained"
                onClick={() => {
                  socket.emit("game:end_room", { userId, roomCode });
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
                  socket.emit("game:end_room", { userId, roomCode });
                  setStage(StageEnum.PLAY);
                }}
              >
                Play again
              </Button>
            </Stack>
          </Stack>
          <DefaultBoard inputLetters={letters} />
          <WordListTab
            players={players}
            solutions={solutions}
            setScore={setScore}
          />
        </>
      )}
    </div>
  );
};

export default VersusResultStage;

interface VersusResultStageProps {
  solutions: Words[];
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
