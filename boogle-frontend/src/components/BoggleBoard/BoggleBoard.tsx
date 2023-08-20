import React, { useEffect, useState } from "react";
import CSS from "csstype";
import { Players } from "../../stages/core";
import { useAppSelector } from "../../app/hooks";
import { selectGlobalName } from "../../redux/features/globalSlice";
const BoggleBoard: React.FC<BoggleBoardProps> = ({
  letters,
  setWord,
  players,
  setPlayers,
}) => {
  const [selectedBoxes, setSelectedBoxes] = useState(new Set<number>());
  const [lastIndex, setLastIndex] = useState(0);
  const name = useAppSelector(selectGlobalName);

  const handleBoxClick = (index: number) => {
    setSelectedBoxes((prev) => new Set(prev.add(index)));
    setLastIndex(index);
  };

  const handleBoxTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (selectedBoxes.size === 0) return;

    const touch = event.touches[0];
    const checkbox = document.elementFromPoint(touch.clientX, touch.clientY);

    if (!checkbox) return;

    const indexChar = checkbox.getAttribute("data-key") as string | null;
    if (!indexChar) return;

    const index = parseInt(indexChar);

    if (!selectedBoxes.has(index) && areIndicesAdjacent(lastIndex, index)) {
      setLastIndex(index);
      setSelectedBoxes((prev) => new Set(prev.add(index)));
    }
  };

  const handleBoxTouchEnd = () => {
    const word =
      Array.from(selectedBoxes)
        .map((index) => letters[index])
        .join("")
        .toUpperCase() || " ";

    if (word.length > 2) {
      setPlayers({
        ...players,
        [name]: [
          ...players[name],
          {
            word: word,
            checked: true,
          },
        ],
      });
    }

    setSelectedBoxes(new Set<number>());
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

  const isBoxSelected = (index: number) => selectedBoxes.has(index);

  useEffect(() => {
    const preventDefaultTouchmove = (event: TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventDefaultTouchmove, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventDefaultTouchmove);
      setSelectedBoxes(new Set<number>());
    };
  }, []);

  useEffect(() => {
    const newWord =
      Array.from(selectedBoxes)
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
