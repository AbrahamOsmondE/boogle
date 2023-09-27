import React from "react";
import "./LoadingOverlay.css";

const LoadingOverlay: React.FC<LoadingOverlayProps> = () => {
  return (
    <div className="default-bg">
      <div className="countdown-overlay">
        <div className="loading-spinner">
          <div className="quarter-circle" id="circle1"></div>
          <div className="quarter-circle" id="circle2"></div>
          <div className="quarter-circle" id="circle3"></div>
          <div className="quarter-circle" id="circle4"></div>
        </div>
      </div>
    </div>
  );
};

interface LoadingOverlayProps {}

export default LoadingOverlay;
