import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

import CSS from "csstype";
import BoggleBoard from "../../components/BoggleBoard/BoggleBoard";
import ScreenCountDown from "../../components/ScreenCountdown/ScreenCountdown";
import TextCountdown from "../../components/TextCountdown/TextCountdown";
import { Typography } from "@mui/material";
import DefaultBoard from "../../components/BoggleBoard/DefaultBoard";
import WordListTab from "../../components/WordListTab/WordListTab";
import PlayStage from "../../stages/PlayStage/PlayStage";
import CleanUpStage from "../../stages/CleanUpStage/CleanUpStage";
import { Players, StageEnum } from "../../stages/core";

const PracticeScreen: React.FC<PracticeScreenProps> = ({ setScreen }) => {
  const [stage, setStage] = useState(0)
  const [players, setPlayers]:[Players, Dispatch<SetStateAction<Players>>] = useState({
    player1: [],
    solution: []
  } as Players)
  const renderStage = (stage:number) => {
    switch (stage) {
      case StageEnum.PLAY:
        return <PlayStage setScreen={setScreen} setStage={setStage} players={players} setPlayers={setPlayers} />
      case StageEnum.CLEANUP:
        return <CleanUpStage setScreen={setScreen} setStage={setStage} players={players} setPlayers={setPlayers}/>
      case StageEnum.RESULT:
        return <div></div>
    } 
  }
  return (
    <div>
      {renderStage(stage)}
    </div>
  )
};

export default PracticeScreen;

interface PracticeScreenProps {
  setScreen: (value: number) => void;
}
