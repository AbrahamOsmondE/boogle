import React, { useState, useEffect } from "react";
import "./ScreenCountdown.css";

const ScreenCountDown: React.FC<ScreenCountDownProps> = ({ count }) => {
  return count !== 0 ? (
    <div className="countdown-overlay">
      <div className={`countdown-number-${count}`}>{count}</div>
    </div>
  ) : (
    <></>
  );
};

interface ScreenCountDownProps {
  count: number;
}

export default ScreenCountDown;
