import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { TextField } from "@mui/material";
import { setGlobalName } from "../../redux/features/globalSlice";
import { useAppDispatch } from "../../app/hooks";

const LinkJoinRoomDialog: React.FC<LinkJoinRoomDialogProps> = ({ setOpen }) => {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };

  const dispatch = useAppDispatch();

  const joinRoom = () => {
    if (!name) {
      setError(true);
      return;
    }

    localStorage.setItem("name", name);
    dispatch(setGlobalName(name));
    //do websocket shit to initialize the game, and send the user to the versus round
  };

  const handleInputChange = (event: any) => {
    setError(false);
    setName(event.target.value);
  };

  useEffect(() => {
    const url = new URL(window.location.href);

    const queryParams = new URLSearchParams(url.search);
    const code = queryParams.get("join");

    if (code) setRoomCode(code);
  }, []);

  return (
    <div>
      <DialogTitle id="responsive-dialog-title">Enter your name</DialogTitle>
      <DialogContent>
        <TextField
          id="outlined-basic"
          label="Enter your name"
          variant="outlined"
          value={name}
          onChange={handleInputChange}
          error={error}
          placeholder={error ? "Enter name!" : "Enter your name"}
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

export default LinkJoinRoomDialog;

interface LinkJoinRoomDialogProps {
  setOpen: (value: boolean) => void;
}
