import React, { useEffect, useState } from "react";
import CSS from "csstype";
import { Players } from "../../stages/core";
const BoggleBoard: React.FC<BoggleBoardProps> = ({ letters, setWord }) => {
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);

  const handleBoxClick = (index: number) => {
    setSelectedBoxes([index]);
  };

  const handleBoxTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (selectedBoxes.length === 0) return;

    const touch = event.touches[0];
    const checkbox = document.elementFromPoint(touch.clientX, touch.clientY);

    const indexChar = checkbox?.getAttribute("data-key") as string | null;
    if (!indexChar) return;

    const index = parseInt(indexChar);

    if (
      !selectedBoxes.includes(index) &&
      areIndicesAdjacent(selectedBoxes[selectedBoxes.length - 1], index)
    ) {
      setSelectedBoxes([...selectedBoxes, index]);
    }
  };

  const handleBoxTouchEnd = () => {
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
    const preventDefaultTouchmove = (event: TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventDefaultTouchmove, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventDefaultTouchmove);
      setSelectedBoxes([]);
    };
  }, []);

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
          onTouchMove={(event) => handleBoxTouchMove(event)}
          onTouchEnd={handleBoxTouchEnd}
          onTouchStart={() => handleBoxClick(index)}
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
