import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { socket } from "../..";
import { setGlobalBoard, setTimeLeft } from "../../redux/features/globalSlice";
import { useAppDispatch } from "../../app/hooks";
import { useNavigate } from "react-router-dom";
import { ROUND_TIME } from "../../stages/core";

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({ setOpen }) => {
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const handleClose = () => {
    localStorage.clear();

    socket.emit("game:cancel_room", { roomCode });
    setOpen(false);
  };

  const shareRoomLink = () => {
    const currentUrl = window.location.href;
    const shareUrl = `${currentUrl}?join=${roomCode}`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  useEffect(() => {
    const roomCode = localStorage.getItem("roomCode");

    if (roomCode) return;
    localStorage.clear();
    socket.emit("game:create_room");

    socket.on("roomCreated", (data) => {
      setRoomCode(data.roomCode);
      localStorage.setItem("roomCode", data.roomCode);
      localStorage.setItem("userId", data.userId);
    });

    socket.on("initializeNextRound", (data) => {
      const board = data.board;
      dispatch(setTimeLeft(ROUND_TIME));
      dispatch(setGlobalBoard(board));

      navigate("/versus");
    });

    return () => {
      socket.off("roomCreated");
      socket.off("initializeNextRound");
    };
  }, []);

  return (
    <div>
      <DialogTitle id="responsive-dialog-title">
        {`Room Code: ${roomCode}`}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Share the room code or link and wait for someone to join
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={shareRoomLink}>
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </div>
  );
};

export default CreateRoomDialog;

interface CreateRoomDialogProps {
  setOpen: (value: boolean) => void;
}
