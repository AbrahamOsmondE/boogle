import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({ setOpen }) => {
  const [roomCode, setRoomCode] = useState("ABCDEF");
  const [copied, setCopied] = useState(false);
  const handleClose = () => {
    //websocket close room
    setOpen(false);
  };

  const shareRoomLink = () => {
    const currentUrl = window.location.href;
    const shareUrl = `${currentUrl}?join=${roomCode}`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  useEffect(() => {
    //get room link
    //store userId and roomCode locally
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