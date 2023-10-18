import React, { useState } from "react";
import { Tabs, Tab, List, ListItem, ListItemText } from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import { TabContext } from "@mui/lab";
import { Players, Words } from "../../stages/core";

const WordListTab: React.FC<WordListTabProps> = ({
  players,
  solutions,
  setScore,
}) => {
  const [selectedTab, setSelectedTab] = useState("0");
  const handleTabChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: string,
  ) => {
    setSelectedTab(newValue);
    Object.keys(players)?.map((player, index) => {
      if (newValue === index.toString()) {
        const score = countScore(players[player]) ?? 0;
        if (setScore) setScore(score);
      }
    });
  };

  const isInSolution = (word: string) => {
    return players["solutions"]?.some((wordObj) => wordObj.word === word);
  };
  const countScore = (player: Words[]) => {
    return player?.reduce((res, cur) => {
      const wordLength = cur.word.length;
      let score = [0, 0];

      if (wordLength >= 8) {
        score = [5, -4];
      } else if (wordLength >= 7) {
        score = [4, -3];
      } else if (wordLength >= 6) {
        score = [3, -2];
      } else if (wordLength >= 5) {
        score = [2, -1];
      } else if (wordLength >= 3) {
        score = [1, -1];
      }
      if (cur.checked) {
        return res + score[0];
      } else {
        return isInSolution(cur.word)
          ? res + score[0] - score[1]
          : res + score[1];
      }
    }, 0);
  };
  // White/green/red = Unchallenged/correct/wrong, provide description if unchallenged but not a word (PHONY)
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
          {Object.keys(players)?.map((playerName, index) => (
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
        {Object.keys(players)?.map((playerName, playerIndex) => (
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
              {players[playerName]?.map((word, wordIndex) => {
                const displayedWord =
                  word.checked && !isInSolution(word.word)
                    ? `${word.word} (PHONY)`
                    : word.word;
                const wordColor =
                  playerName === "solutions" || word.checked
                    ? "white"
                    : isInSolution(word.word)
                    ? "green"
                    : "red";
                return (
                  <ListItem key={wordIndex}>
                    <ListItemText
                      primary={displayedWord}
                      primaryTypographyProps={{
                        variant: "body2",
                        style: {
                          fontSize: "15px",
                          color: wordColor,
                        },
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </TabPanel>
        ))}
      </div>
    </TabContext>
  );
};

interface WordListTabProps {
  players: Players;
  solutions: Words[];
  setScore?: (score: number) => void;
}

export default WordListTab;
