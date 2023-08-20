import React, { useEffect, useRef, useState } from "react";
import {
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import EditIcon from "@mui/icons-material/Edit";
import { TabContext } from "@mui/lab";
import { Players } from "../../stages/core";

const WordListTabCleanUp: React.FC<WordListTabCleanUpProps> = ({ players, setPlayers }) => {
  const [open, setOpen] = useState(false);
  const [editedWord, setEditedWord] = useState("");
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editWordIndex, setEditWordIndex] = useState(-1);
  const [error, setError] = useState(false)

  const [selectedTab, setSelectedTab] = useState("0");

  const textFieldRef = useRef<HTMLInputElement | null>(null);

  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: string,
  ) => {
    setSelectedTab(newValue);
  };

  const handleEditClick = (playerName: string, wordIndex: number) => {
    setEditPlayerName(playerName);
    setEditWordIndex(wordIndex);
    setEditedWord(players[playerName][wordIndex].word);
    setOpen(true)
  };

  const handleCheckboxToggle = (playerName: string, wordIndex: number) => {
    const updatedPlayers = {
      ...players,
      [playerName]: players[playerName].map((item, index) => {
        if (index === wordIndex) {
          return {
            ...item,
            checked: !item.checked, // Invert the checked value
          };
        }
        return item;
      }),
    };
    setPlayers(updatedPlayers);
  };

  const handleClose = () => {
    if(textFieldRef.current) textFieldRef.current.blur()
    setOpen(false);
  };

  const handleSave = () => {
    const alphabetPattern = /^[a-zA-Z]+$/;

    if (!alphabetPattern.test(editedWord)){
      setError(true)
      return
    }
    const updatedPlayers = {
      ...players,
      [editPlayerName]: players[editPlayerName].map((item, index) => {
        if (index === editWordIndex) {
          return {
            ...item,
            word: editedWord.toUpperCase(),
          };
        }
        return item;
      }),
    };
    setPlayers(updatedPlayers);
    setOpen(false);
  };

  return (
    <>
      <TabContext value={selectedTab}>
      <div style={{ width: "70%" }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          style={{ border: "1px solid grey", borderBottom: "0px solid grey" }}
          TabIndicatorProps={{ style: { background: "white" } }}
        >
          {Object.keys(players).map((playerName, index) => (
            <Tab
              key={index}
              disabled={playerName === "solutions"}
              label={playerName}
              value={index.toString()}
              style={{
                color: selectedTab === index.toString() ? "white" : "grey",
              }}
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "white",
                },
                "&.Mui-selected": {
                  color: "white",
                  "& .MuiTabFocusRipple-root": {
                    color: "white",
                  },
                },
              }}
            />
          ))}
        </Tabs>
        {Object.keys(players).map((playerName, playerIndex) => (
          <TabPanel
            key={playerIndex}
            value={playerIndex.toString()}
            style={{
              height: "60vh",
              overflowY: "auto",
              padding: "0px 4px",
              border: "1px solid grey",
            }}
          >
            <List style={{ paddingTop: "0px" }}>
              {players[playerName].map((word, wordIndex) => (
                <ListItem key={wordIndex} style={{paddingTop:"0", paddingBottom:"0", marginTop: "1rem", height:"1.2rem"}}>
                  <ListItemText
                    primary={word.word}
                    primaryTypographyProps={{
                      variant: "body2",
                      style: { fontSize: "14px", textDecoration: word.checked ? "": "line-through"  },
                    }}
                    style={{marginTop: '0', marginBottom:'0'}}
                  />
                  <Checkbox
                    checked={players[playerName][wordIndex].checked}
                    onClick={() => handleCheckboxToggle(playerName, wordIndex)}
                    style={{ marginRight: "10px", color: "white", padding: '0px', height:'100%' }}
                    sx={{
                      "& .MuiSvgIcon-root": {
                        height: "100%"
                      },
                      "& .MuiTouchRipple-root": {
                        height: "100%"
                      }
                    }}
                  />
                  <EditIcon
                    onClick={() => handleEditClick(playerName, wordIndex)}
                    style={{ height: '100%' }}
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>
        ))}
      </div>
      </TabContext>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit Answer</DialogTitle>
        <DialogContent>
        {error && <DialogContentText>Alphabet only!</DialogContentText>}
          <TextField
            error={error}
            autoFocus
            margin="dense"
            value={editedWord}
            onChange={(e) => {
              setError(false)
              setEditedWord(e.target.value)}}
            fullWidth
            inputRef={textFieldRef}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export interface WordListTabCleanUpProps {
  players: Players;
  setPlayers: (value:Players) => void;
}

export default WordListTabCleanUp;
