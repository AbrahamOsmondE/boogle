import React from "react";
import TextField from "@mui/material/TextField";
import SendIcon from "@mui/icons-material/Send";
import IconButton from "@mui/material/IconButton";
import CSS from "csstype";

const AnswerBox: React.FC<AnswerBoxProps> = ({ setIsKeyboardOpen }) => {
  const containerStyle: CSS.Properties = {
    width: "100%",
    backgroundColor: "white",
    padding: "0px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const inputStyle = {
    flex: 1,
    marginRight: "10px",
  };

  return (
    <div style={containerStyle}>
      <TextField
        style={inputStyle}
        fullWidth
        variant="outlined"
        onFocus={() => {
          setIsKeyboardOpen(true);
        }}
        onBlur={() => {
          setIsKeyboardOpen(false);
        }}
      />
      <IconButton color="primary">
        <SendIcon />
      </IconButton>
    </div>
  );
};

export default AnswerBox;

interface AnswerBoxProps {
  setIsKeyboardOpen: (value: boolean) => void;
}
