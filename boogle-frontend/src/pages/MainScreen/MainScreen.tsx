import React, { useEffect, useState } from "react";
import { Button, Stack, Dialog, Typography } from "@mui/material";
import CreateRoomDialog from "../../components/CreateRoomDialog/CreateRoomDialog";
import CSS from "csstype";
import { useNavigate } from "react-router-dom";
import JoinRoomDialog from "../../components/JoinRoomDialog/JoinRoomDialog";
import { socket } from "../..";
import { useAppDispatch } from "../../app/hooks";
import { setGlobalBoard } from "../../redux/features/globalSlice";

const MainScreen: React.FC = () => {
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [joinRoomOpen, setJoinRoomOpen] = useState(false);

  const navigate = useNavigate();

  const handleCreateRoomClose = () => {
    setCreateRoomOpen(false);
  };

  const handleJoinRoomClose = () => {
    setJoinRoomOpen(false);
  };

  const dispatch = useAppDispatch();

  useEffect(() => {
    const url = new URL(window.location.href);

    const queryParams = new URLSearchParams(url.search);
    const roomCodeParam = queryParams.get("join");

    //do exact same on join room dialog
    socket.on("joinedRoom", (data) => {
      console.log(data);
      localStorage.clear();
      if (!data.isPlayer) alert("Room is full!");

      localStorage.setItem("roomCode", data.roomCode);
      localStorage.setItem("userId", data.userId);
      dispatch(setGlobalBoard(data.board));

      navigate("/versus");
    });

    socket.on("roomNotFound", (data) => {
      alert("Room not found!");
    });

    socket.on("roomJoiningError", (data) => {
      alert(`Error joining room: ${data.error}`);
    });

    if (roomCodeParam) {
      socket.emit("game:join_room", { roomCode: roomCodeParam });
    }

    return () => {
      socket.off("joinedRoom");
      socket.off("roomNotFound");
      socket.off("roomJoiningError");
    };
  }, []);

  return (
    <div style={containerStyle}>
      <Typography variant="h2" gutterBottom style={{ color: "grey" }}>
        b o o g l e.
      </Typography>
      <Stack spacing={3}>
        <Typography variant="h6" gutterBottom style={{ color: "white" }}>
          Create a Room
        </Typography>
        <Stack spacing={2} direction="row">
          <Button
            style={{ backgroundColor: "grey" }}
            variant="contained"
            onClick={() => {
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
