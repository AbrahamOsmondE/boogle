import React, { useState } from "react";
import { Button, Stack, Dialog, Typography } from "@mui/material";
import PracticeDialog from "../../components/PraticeDialog/PracticeDialog";

const MainScreen: React.FC<MainScreenProps> = ({ setScreen }) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return <div>
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom style={{ color: 'white' }}>
        Create a Room
      </Typography>
      <Stack spacing={2} direction="row">
        <Button variant="contained" onClick={() => {
          setScreen(1)
        }}>Practice</Button>
        <Button variant="contained">Versus</Button>
      </Stack>
      <Typography variant="h6" gutterBottom style={{ color: 'white' }}>
        Join a Room
      </Typography>
      <Button variant="contained">Join</Button>
    </Stack>
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <PracticeDialog setOpen={setOpen} setScreen={setScreen} />
    </Dialog>
  </div>
}

export default MainScreen

interface MainScreenProps {
  setScreen: (value: number) => void
}