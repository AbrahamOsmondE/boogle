import React, { useState } from "react";

import CSS from 'csstype'
import BoggleBoard from "../../components/BoggleBoard/BoggleBoard";
import AnswerBox from "../../components/AnswerBox/AnswerBox";

const PracticeScreen: React.FC<PracticeScreenProps> = ({setScreen}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  return (
    <div style={containerStyle}>
      <BoggleBoard></BoggleBoard>
      <AnswerBox setIsKeyboardOpen={setIsKeyboardOpen}></AnswerBox>
    </div>
  );
}

export default PracticeScreen

interface PracticeScreenProps {
  setScreen: (value:number) => void
}

const containerStyle:CSS.Properties = {
  maxHeight: '100vh', // Set the height of the parent container to full viewport height
  width: '100%',
  position: 'relative',
};
