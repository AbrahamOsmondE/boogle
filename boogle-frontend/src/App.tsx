import React, { useState } from "react";
import "./App.css";
import MainScreen from "./pages/MainScreen/MainScreen";
import PracticeScreen from "./pages/PracticeScreen/PracticeScreen";

function App() {
  const [screen, setScreen] = useState(0);

  const renderScreen = () => {
    switch (screen) {
      case Screens.MainScreen:
        return <MainScreen setScreen={setScreen} />;
      case Screens.PracticeScreen:
        return <PracticeScreen setScreen={setScreen} />;
      default:
        return <MainScreen setScreen={setScreen} />;
    }
  };
  return <div className="App">{renderScreen()}</div>;
}

export default App;

enum Screens {
  MainScreen = 0,
  PracticeScreen = 1,
}
