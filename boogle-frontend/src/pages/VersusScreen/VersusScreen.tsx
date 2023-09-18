import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import VersusPlayStage from "../../stages/VersusPlayStage/VersusPlayStage";
import VersusCleanUpStage from "../../stages/VersusCleanUpStage/VersusCleanUpStage";
import { Players, Solutions, StageEnum, Words } from "../../stages/core";
import VersusResultStage from "../../stages/VersusResultStage/VersusResultStage";
import { boogleAxios } from "../..";
import { OPPONENTS_NAME, YOUR_NAME } from "../../constants";
import VersusChallengeStage from "../../stages/VersusChallengeStage/VersusChallengeStage";
import LoadingOverlay from "../../components/LoadingOverlay/LoadingOverlay";
const VersusScreen: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [players, setPlayers]: [Players, Dispatch<SetStateAction<Players>>] =
    useState({});
  const [letters, setLetters] = useState(generateRandomBoggleBoard());
  const [solutions, setSolutions] = useState<Solutions>({});

  useEffect(() => {
    if (stage === StageEnum.PLAY) {
      setLetters(generateRandomBoggleBoard()); //get from BE
      setPlayers({
        [YOUR_NAME]: [],
        [OPPONENTS_NAME]: [],
        solutions: [],
      });
      setSolutions({});
    } else if (stage === StageEnum.CLEANUP) {

    } else if (stage === StageEnum.CHALLENGE) {

    } else if (stage === StageEnum.RESULT) {

    } else {
      //check local storage for stage, if not, initialize the stage to be 0 (store stage, userId, roomCode in 1 json)
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

      setSolutions(boardSolution);

      const squashedSquashedList = Object.values(
        boardSolution,
      ).flat() as string[];
      const solutionPlayer: Words[] = squashedSquashedList.map((word) => ({
        word: word,
        checked: true,
      }));
      setPlayers({
        ...players,
        solutions: solutionPlayer,
      });
    } catch (error) {
      console.error("Error invoking Lambda function:", error);
    }
  };

  useEffect(() => {
    if (letters && players.solutions?.length === 0) {
      invokeLambda();
    }
  }, [letters]);

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
        )
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
        return <LoadingOverlay />
    }
  };
  return <div>{renderStage(stage)}</div>;
};

export default VersusScreen;

const generateRandomBoggleBoard = () => {
  const boggleDice = [
    ["A", "A", "E", "E", "G", "N"],
    ["E", "L", "R", "T", "T", "Y"],
    ["A", "O", "O", "T", "T", "W"],
    ["A", "B", "B", "J", "O", "O"],
    ["E", "H", "R", "T", "V", "W"],
    ["C", "I", "M", "O", "T", "U"],
    ["D", "I", "S", "T", "T", "Y"],
    ["E", "I", "O", "S", "S", "T"],
    ["D", "E", "L", "R", "V", "Y"],
    ["A", "C", "H", "O", "P", "S"],
    ["H", "I", "M", "N", "Qu", "U"],
    ["E", "E", "I", "N", "S", "U"],
    ["E", "E", "G", "H", "N", "W"],
    ["A", "F", "F", "K", "P", "S"],
    ["H", "L", "N", "N", "R", "Z"],
    ["D", "E", "I", "L", "R", "X"],
  ];

  const boggleBoard = [];

  for (let i = 0; i < 16; i++) {
    const dieIndex = Math.floor(Math.random() * boggleDice.length);
    const dieFaces = boggleDice[dieIndex];
    const faceIndex = Math.floor(Math.random() * dieFaces.length);
    boggleBoard.push(dieFaces[faceIndex]);
  }

  return boggleBoard;
};
