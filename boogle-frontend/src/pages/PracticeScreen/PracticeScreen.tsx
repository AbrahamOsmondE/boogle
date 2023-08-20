import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import PlayStage from "../../stages/PlayStage/PlayStage";
import CleanUpStage from "../../stages/CleanUpStage/CleanUpStage";
import { Players, StageEnum } from "../../stages/core";
import { useAppSelector } from "../../app/hooks";
import { selectGlobalName } from "../../redux/features/globalSlice";

const PracticeScreen: React.FC<PracticeScreenProps> = ({ setScreen }) => {
  const [stage, setStage] = useState(0);
  const [players, setPlayers]: [Players, Dispatch<SetStateAction<Players>>] =
    useState({});
  const name = useAppSelector(selectGlobalName);

  useEffect(() => {
    setPlayers({
      [name]: [],
      solutions: [],
    });
  }, []);
  const renderStage = (stage: number) => {
    switch (stage) {
      case StageEnum.PLAY:
        return (
          <PlayStage
            setScreen={setScreen}
            setStage={setStage}
            players={players}
            setPlayers={setPlayers}
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
        return <div></div>;
    }
  };
  return <div>{renderStage(stage)}</div>;
};

export default PracticeScreen;

interface PracticeScreenProps {
  setScreen: (value: number) => void;
}
