import React, { useState } from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { TextField } from "@mui/material";
import { socket } from "../..";

const JoinRoomDialog: React.FC<JoinRoomDialogProps> = ({ setOpen }) => {
  const [roomCode, setRoomCode] = useState("");
  const handleClose = () => {
    setOpen(false);
  };

  const joinRoom = () => {
    if (roomCode) {
      socket.emit("game:join_room", {roomCode: roomCode})
      return
    }
  };

  const handleInputChange = (event: any) => {
    setRoomCode(event.target.value);
  };

  return (
    <div>
      <DialogTitle id="responsive-dialog-title">Enter Room Code</DialogTitle>
      <DialogContent>
        <TextField
          id="outlined-basic"
          label="Enter a Room Code"
          variant="outlined"
          value={roomCode}
          onChange={handleInputChange}
        />
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          Close
        </Button>
        <Button onClick={joinRoom} autoFocus>
          Join
        </Button>
      </DialogActions>
    </div>
  );
};

export default JoinRoomDialog;

interface JoinRoomDialogProps {
  setOpen: (value: boolean) => void;
}
