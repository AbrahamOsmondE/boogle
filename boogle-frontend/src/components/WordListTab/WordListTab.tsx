import React, { useState } from "react";
import { Tabs, Tab, List, ListItem, ListItemText } from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import { TabContext } from "@mui/lab";
import { Players, Solutions } from "../../stages/core";

const WordListTab: React.FC<WordListTabProps> = ({ players, solutions }) => {
  const [selectedTab, setSelectedTab] = useState("0");
  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: string,
  ) => {
    setSelectedTab(newValue);
  };

  const isInSolution = (word: string) => {
    const sortedWord = word?.split("").sort().join("");

    return solutions[sortedWord]?.includes(word);
  };

  return (
    <TabContext value={selectedTab}>
      <div style={{ width: "70%", marginTop: "3vh" }}>
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
              label={playerName}
              value={index.toString()}
              style={{
                color: selectedTab === index.toString() ? "white" : "grey",
              }}
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "white", // Change indicator background color to white
                },
                "&.Mui-selected": {
                  color: "white", // Highlighted tab text color
                  "& .MuiTabFocusRipple-root": {
                    color: "white", // Change focus ripple color to white
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
              height: "20vh",
              overflowY: "auto",
              padding: "0px 4px",
              border: "1px solid grey",
            }}
          >
            <List style={{ paddingTop: "0px" }}>
              {players[playerName].map((word, wordIndex) => (
                <ListItem key={wordIndex}>
                  <ListItemText
                    primary={word.word}
                    primaryTypographyProps={{
                      variant: "body2",
                      style: {
                        fontSize: "15px",
                        color:
                          playerName === "solutions"
                            ? "white"
                            : isInSolution(word.word)
                            ? "green"
                            : "red",
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>
        ))}
      </div>
    </TabContext>
  );
};

interface WordListTabProps {
  players: Players;
  solutions: Solutions;
}

export default WordListTab;
