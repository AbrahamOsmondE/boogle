import React, { useEffect, useState } from "react";
import CSS from "csstype";
import { Players } from "../../stages/core";
import { YOUR_NAME } from "../../constants";
const BoggleBoard: React.FC<BoggleBoardProps> = ({
  letters,
  setWord,
  players,
  setPlayers,
  sendWord,
}) => {
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  const [lastIndex, setLastIndex] = useState(0);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setSelectedBoxes([...selectedBoxes, index]);
    setLastIndex(index);
  };

  const handlePointerEnter = (e: React.PointerEvent, index: number) => {
    if (selectedBoxes.length === 0) return;

    if (
      !selectedBoxes.includes(index) &&
      areIndicesAdjacent(lastIndex, index)
    ) {
      setLastIndex(index);
      setSelectedBoxes([...selectedBoxes, index]);
    }
  };

  const handleBoxTouchEnd = () => {
    const word =
      selectedBoxes
        .map((index) => letters[index])
        .join("")
        .toUpperCase() || " ";

    if (word.length > 2) {
      if (sendWord) sendWord(word);
      setPlayers({
        ...players,
        [YOUR_NAME]: [
          ...players[YOUR_NAME],
          {
            word: word,
            checked: true,
          },
        ],
      });
    }

    setSelectedBoxes([]);
  };

  const areIndicesAdjacent = (index1: number, index2: number) => {
    const numCols = 4;

    const row1 = Math.floor(index1 / numCols);
    const col1 = index1 % numCols;

    const row2 = Math.floor(index2 / numCols);
    const col2 = index2 % numCols;

    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);

    return rowDiff <= 1 && colDiff <= 1;
  };

  const isBoxSelected = (index: number) => selectedBoxes.includes(index);

  useEffect(() => {
    const newWord =
      selectedBoxes
        .map((index) => letters[index])
        .join("")
        .toUpperCase() || " ";
    setWord(newWord);
  }, [selectedBoxes]);

  return (
    <div style={gridContainerStyle}>
      {letters.map((letter, index) => (
        <div
          data-key={index}
          key={index}
          style={isBoxSelected(index) ? selectedBoxStyle : boxStyle}
          onPointerDown={(event) => {
            handlePointerDown(event, index);
          }}
          onPointerEnter={(event) => {
            handlePointerEnter(event, index);
          }}
          onTouchEnd={handleBoxTouchEnd}
        >
          {letter}
        </div>
      ))}
    </div>
  );
};

export default BoggleBoard;

interface BoggleBoardProps {
  letters: string[];
  setWord: (value: string) => void;
  players: Players;
  setPlayers: (value: Players) => void;
  sendWord?: (word: string) => void;
}

const gridContainerStyle: CSS.Properties = {
  width: "70%",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  padding: "0px 50px 0px 50px",
  touchAction: "none",
};

const boxStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "50px",
  border: "2px solid grey",
  color: "white",
  fontSize: "24px",
};

const selectedBoxStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "50px",
  border: "2px solid grey",
  backgroundColor: "white",
  color: "black",
  fontSize: "24px",
};
