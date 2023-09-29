import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import VersusPlayStage from "../../stages/VersusPlayStage/VersusPlayStage";
import VersusCleanUpStage from "../../stages/VersusCleanUpStage/VersusCleanUpStage";
import { Players, StageEnum, Words } from "../../stages/core";
import VersusResultStage from "../../stages/VersusResultStage/VersusResultStage";
import { boogleAxios, socket } from "../..";
import { OPPONENTS_NAME, YOUR_NAME } from "../../constants";
import VersusChallengeStage from "../../stages/VersusChallengeStage/VersusChallengeStage";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
import { useAppSelector } from "../../app/hooks";
import { selectGlobalBoard } from "../../redux/features/globalSlice";
const VersusScreen: React.FC = () => {
  const [stage, setStage] = useState(10);
  const [players, setPlayers]: [Players, Dispatch<SetStateAction<Players>>] =
    useState({});
  const [letters, setLetters] = useState(defaultBoard);
  const [solutions, setSolutions] = useState<Words[]>([]);
  const board = useAppSelector(selectGlobalBoard);
  const storedStage = localStorage.getItem("stage");

  const roomCode = localStorage.getItem("roomCode");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (stage === StageEnum.PLAY) {
      setLetters(board);
      setPlayers({
        [YOUR_NAME]: [],
        [OPPONENTS_NAME]: [],
        solutions: [],
      });
      setSolutions([]);
    } else if (stage === StageEnum.CLEANUP) {
    } else if (stage === StageEnum.CHALLENGE) {
    } else if (stage === StageEnum.RESULT) {
    } else {
      if (!storedStage) {
        setStage(StageEnum.PLAY);
      } else {
        socket.emit("game:rejoin_room", { roomCode, userId });
      }
    }
  }, [stage]);

  const invokeLambda = async () => {
    try {
      const modifiedLetters = letters
        .map((letter) => (letter === "Qu" ? "Q" : letter))
        .join("");

      const payload = {
        board: modifiedLetters,
      };

      const response = await boogleAxios.post("/solutions", payload);

      const boardSolution = response.data;

      const squashedSquashedList = Object.values(
        boardSolution,
      ).flat() as string[];
      const solutionPlayer: Words[] = squashedSquashedList.map((word) => ({
        word: word,
        checked: true,
      }));

      setSolutions(solutionPlayer);
      socket.emit("game:solution", { solution: solutionPlayer, roomCode });

      setPlayers({
        ...players,
        solutions: solutionPlayer,
      });
    } catch (error) {
      console.error("Error invoking Lambda function:", error);
    }
  };

  useEffect(() => {
    if (!storedStage && letters[0] && players.solutions?.length === 0) {
      invokeLambda();
      localStorage.setItem("stage", '0');
    }
  }, [letters]);

  useEffect(() => {
    socket.on("rejoinedRoom", (data) => {
      const { words, opponentWords, solutions, board, round } = data;

      setLetters(board);
      setPlayers({
        [YOUR_NAME]: words || [],
        [OPPONENTS_NAME]: opponentWords || [],
        solutions: solutions || [],
      });

      setStage(round);
    });

    socket.on("challengeRound", (data) => {
      const { words } = data;
      setPlayers({
        [YOUR_NAME]: players[YOUR_NAME] || [],
        [OPPONENTS_NAME]: words || [],
        solutions: [],
      });
    });

    socket.on("resultRound", (data) => {
      const { playerWordList, opponentWordList, solution } = data;

      setPlayers({
        [YOUR_NAME]: playerWordList || [],
        [OPPONENTS_NAME]: opponentWordList || [],
        solutions: solution || [],
      });
    });

    return () => {
      socket.off("rejoinedRoom");
      socket.off("challengeRound");
      socket.off("resultRound");
    };
  }, []);

  const renderStage = (stage: number) => {
    switch (stage) {
      case StageEnum.PLAY:
        return (
          <VersusPlayStage
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
            letters={letters}
          />
        );
      case StageEnum.CLEANUP:
        return (
          <VersusCleanUpStage
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
          />
        );
      case StageEnum.CHALLENGE:
        return (
          <VersusChallengeStage
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
          />
        );
      case StageEnum.RESULT:
        return (
          <VersusResultStage
            solutions={solutions}
            setStage={setStage}
            players={players}
            letters={letters}
          />
        );
      default:
        return <LoadingOverlay />;
    }
  };
  return <div>{renderStage(stage)}</div>;
};

export default VersusScreen;

const defaultBoard = [
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
];
