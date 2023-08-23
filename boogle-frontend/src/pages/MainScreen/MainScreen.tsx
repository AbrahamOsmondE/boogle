import React, { useEffect, useState } from "react";
import {
  Button,
  Stack,
  Dialog,
  Typography,
  OutlinedInput,
  FormControl,
} from "@mui/material";
import PracticeDialog from "../../components/PraticeDialog/PracticeDialog";
import CSS from "csstype";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  selectGlobalName,
  setGlobalName,
} from "../../redux/features/globalSlice";
import { useNavigate } from "react-router-dom";

const MainScreen: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const [error, setError] = useState(false);
  const username = useAppSelector(selectGlobalName);

  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const handleSubmit = () => {
    localStorage.setItem("name", name);
    dispatch(setGlobalName(name));
    return;
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (name) setName(name);
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
          <Button style={{ backgroundColor: "grey" }} variant="contained">
            Versus
          </Button>
        </Stack>
        <Typography variant="h6" gutterBottom style={{ color: "white" }}>
          Join a Room
        </Typography>
        <Button style={{ backgroundColor: "grey" }} variant="contained">
          Join
        </Button>
      </Stack>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <PracticeDialog setOpen={setOpen} />
      </Dialog>
    </div>
  );
};

export default MainScreen;

const containerStyle: CSS.Properties = {
  maxHeight: "100vh", // Set the height of the parent container to full viewport height
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
