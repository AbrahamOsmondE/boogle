import React, { useEffect, useState } from "react";
import {
  Button,
  Stack,
  Dialog,
  Typography,
  OutlinedInput,
  FormControl,
} from "@mui/material";
import CreateRoomDialog from "../../components/CreateRoomDialog/CreateRoomDialog";
import CSS from "csstype";
import { useAppDispatch } from "../../app/hooks";
import { setGlobalName } from "../../redux/features/globalSlice";
import { useNavigate } from "react-router-dom";
import JoinRoomDialog from "../../components/JoinRoomDialog/JoinRoomDialog";
import LinkJoinRoomDialog from "../../components/LinkJoinRoomDialog/LinkJoinRoomDialog";

const MainScreen: React.FC = () => {
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);
  const [linkJoinRoomOpen, setLinkJoinRoomOpen] = useState(false);
  const [name, setName] = useState("");

  const [error, setError] = useState(false);

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const handleSubmit = () => {
    localStorage.setItem("name", name);
    dispatch(setGlobalName(name));
    return;
  };

  const handleCreateRoomClose = () => {
    setCreateRoomOpen(false);
  };

  const handleJoinRoomClose = () => {
    setJoinRoomOpen(false);
  };

  const handleLinkJoinRoomClose = () => {
    setLinkJoinRoomOpen(false);
  };

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (name) setName(name);

    const url = new URL(window.location.href);

    const queryParams = new URLSearchParams(url.search);
    const roomCode = queryParams.get("join");

    if (roomCode) {
      setLinkJoinRoomOpen(true);
    }
  }, []);

  return (
    <div style={containerStyle}>
      <Typography variant="h2" gutterBottom style={{ color: "grey" }}>
        b o o g l e.
      </Typography>
      <FormControl>
        <OutlinedInput
          name="boogle-username"
          error={error}
          id="outlined-basic"
          placeholder={error ? "Enter name!" : "Enter your name"}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(false);
          }}
          style={{ backgroundColor: "white", marginBottom: "2vh" }}
        />
      </FormControl>
      <Stack spacing={3}>
        <Typography variant="h6" gutterBottom style={{ color: "white" }}>
          Create a Room
        </Typography>
        <Stack spacing={2} direction="row">
          <Button
            style={{ backgroundColor: "grey" }}
            variant="contained"
            onClick={() => {
              if (!name) {
                setError(true);
                return;
              }
              handleSubmit();
              navigate("/practice");
            }}
          >
            Practice
          </Button>
          <Button
            style={{ backgroundColor: "grey" }}
            variant="contained"
            onClick={() => {
              setCreateRoomOpen(true);
            }}
          >
            Versus
          </Button>
        </Stack>
        <Typography variant="h6" gutterBottom style={{ color: "white" }}>
          Join a Room
        </Typography>
        <Button
          style={{ backgroundColor: "grey" }}
          variant="contained"
          onClick={() => {
            setJoinRoomOpen(true);
          }}
        >
          Join
        </Button>
      </Stack>
      <Dialog
        open={createRoomOpen}
        onClose={handleCreateRoomClose}
        aria-labelledby="responsive-dialog-title"
      >
        <CreateRoomDialog setOpen={setCreateRoomOpen} />
      </Dialog>
      <Dialog
        open={joinRoomOpen}
        onClose={handleJoinRoomClose}
        aria-labelledby="responsive-dialog-title"
      >
        <JoinRoomDialog setOpen={setJoinRoomOpen} />
      </Dialog>
      <Dialog
        open={linkJoinRoomOpen}
        onClose={handleLinkJoinRoomClose}
        aria-labelledby="responsive-dialog-title"
      >
        <LinkJoinRoomDialog setOpen={setLinkJoinRoomOpen} />
      </Dialog>
    </div>
  );
};

export default MainScreen;

const containerStyle: CSS.Properties = {
  maxHeight: "100vh",
  width: "100%",
  position: "relative",
  backgroundColor: "#282c34",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "calc(10px + 2vmin)",
  color: "white",
  overflow: "hidden",
  textAlign: "center",
};
