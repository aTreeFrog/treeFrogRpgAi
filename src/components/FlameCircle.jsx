// FlameCircle.js

import React from "react";

const FlameCircle = () => {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <filter id="flameFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence id="turbulence" baseFrequency="0.02" numOctaves="3" result="NOISE" seed="1">
            <animate attributeName="baseFrequency" dur="60s" keyTimes="0;0.5;1" values="0.02;0.05;0.02" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="NOISE" scale="10" />
        </filter>
      </defs>
      <circle cx="100" cy="100" r="70" stroke="orange" strokeWidth="3" fill="none" filter="url(#flameFilter)" />
    </svg>
  );
};

export default FlameCircle;
