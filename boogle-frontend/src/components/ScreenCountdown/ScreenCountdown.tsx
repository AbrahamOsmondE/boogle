import React from "react";
import "./ScreenCountdown.css";

const ScreenCountDown: React.FC<ScreenCountDownProps> = ({ title, count }) => {
  return count !== 0 ? (
    <div className="countdown-overlay">
      <h1 className="countdown-title">{title}</h1>
      <div className={`countdown-number-${count}`}>{count}</div>
    </div>
  ) : (
    <></>
  );
};

interface ScreenCountDownProps {
  title: string;
  count: number;
}

export default ScreenCountDown;
