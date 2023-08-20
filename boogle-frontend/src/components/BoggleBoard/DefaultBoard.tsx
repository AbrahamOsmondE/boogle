import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CSS from "csstype";

const DefaultBoard: React.FC<DefaultBoard> = ({ inputLetters }) => {
  const letters = inputLetters || defaultLetters;
  return (
    <div style={gridContainerStyle}>
      {letters.map((letter, index) => (
        <div data-key={index} key={index} style={boxStyle}>
          {letter}
        </div>
      ))}
    </div>
  );
};

export default DefaultBoard;

interface DefaultBoard {
  inputLetters?: string[];
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

const defaultLetters = [
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
