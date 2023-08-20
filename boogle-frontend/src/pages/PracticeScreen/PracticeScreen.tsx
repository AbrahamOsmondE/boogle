import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import PlayStage from "../../stages/PlayStage/PlayStage";
import CleanUpStage from "../../stages/CleanUpStage/CleanUpStage";
import { Players, StageEnum } from "../../stages/core";
import { useAppSelector } from "../../app/hooks";
import { selectGlobalName } from "../../redux/features/globalSlice";
import ResultStage from "../../stages/ResultStage/ResultStage";

const PracticeScreen: React.FC<PracticeScreenProps> = ({ setScreen }) => {
  const [stage, setStage] = useState(0);
  const [players, setPlayers]: [Players, Dispatch<SetStateAction<Players>>] =
    useState({});
  const name = useAppSelector(selectGlobalName);
  const [letters, setLetters] = useState(generateRandomBoggleBoard());

  useEffect(() => {
    if (stage === 0) {
      setLetters(generateRandomBoggleBoard());
      setPlayers({
        [name]: [],
        solutions: [],
      });
    }
  }, [stage]);

  const renderStage = (stage: number) => {
    switch (stage) {
      case StageEnum.PLAY:
        return (
          <PlayStage
            setScreen={setScreen}
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
            letters={letters}
          />
        );
      case StageEnum.CLEANUP:
        return (
          <CleanUpStage
            setScreen={setScreen}
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
          />
        );
      case StageEnum.RESULT:
        return (
          <ResultStage
            setScreen={setScreen}
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
            letters={letters}
          />
        );
    }
  };
  return <div>{renderStage(stage)}</div>;
};

export default PracticeScreen;

interface PracticeScreenProps {
  setScreen: (value: number) => void;
}

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
