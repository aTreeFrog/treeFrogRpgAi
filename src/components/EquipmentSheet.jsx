import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

// Mock data for testing
const yourDataArray = [
  {
    name: "Health",
    icon: "icons/healthpotion.svg",
    quantity: "3",
    duration: "n/a",
    impact: "+5",
    description: "Mystical red liquid to heal your wounds",
    type: "potion",
  },

  // Add more mock data as needed
];

export default function EquipmentSheet({ player, equipmentRow, setEquipmentRow, isD20Spinning }) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [headerGlow, setHeaderGlow] = useState(false);

  useEffect(() => {
    //if failed an attack or attacked and dealt damage, no longer highlight any selected attack slots
    if (player?.battleMode?.yourTurn && player?.battleMode?.actionAttempted) {
      setEquipmentRow(null);
    }
  }, [player]);

  const getClassName = (item, position) => {
    if (equipmentRow === item) {
      return `attackRow${position}Clicked`; // Replace with your selected class names
    } else if (hoveredRow === item) {
      return `attackRow${position}Hovered`; // Replace with your hovered class names
    }
    return "";
  };

  // Function to handle row selection, respecting the actionAttempted condition
  const handleSelectRow = (item) => {
    // Check if action has been attempted; if so, do not allow changing the selected row
    if (player?.battleMode?.actionAttempted || isD20Spinning) {
      console.log("Action has already been attempted. Cannot change selection.");
      return; // Early return to prevent changing the selection
    }

    // If action has not been attempted, allow changing the selected row
    setEquipmentRow(equipmentRow === item ? null : item);

    if (!(equipmentRow === item || item == null)) {
      const clickedTone = new Tone.Player({
        url: "/audio/selected.wav",
      }).toDestination();

      clickedTone.autostart = true;

      clickedTone.onstop = () => {
        console.log("selected playback ended");
        clickedTone.disconnect(); // Disconnect the player
      };

      clickedTone.onerror = (error) => {
        console.error("Error with audio playback", error);
      };
    }
  };

  return (
    <div
      className="relative block p-3 "
      style={{
        height: "23.5rem",
        width: "95%",
        position: "absolute",
        top: "27%", // Adjust the top position as needed
        left: "2.5%",
        borderRadius: "5px",
        backgroundColor: "rgba(45, 55, 72, 0.2)",
        boxShadow: "none",
        //animation: headerGlow ? 'glowing 4s infinite' : 'none',
      }}>
      <div className="absolute top-1/2 left-1/2 overflow-auto scrollable-container transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-opacity-20">
        <div className="grid grid-cols-4 text-white font-semibold text-center whitespace-nowrap">
          <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`}>
            Name
          </button>
          <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`}>
            Qty
          </button>
          <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`} style={{ paddingLeft: "5px" }}>
            Duration
          </button>
          <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`}>
            Impact
          </button>
          {/* Dynamic data cells */}
          {/* Use a mapping function to generate the data cells dynamically */}
          {yourDataArray.map((item, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => handleSelectRow(item)}
                className={`flex items-center justify-center p-3 text-base mt-1 ${getClassName(item, "Left")}`}
                onMouseEnter={() => setHoveredRow(item)}
                onMouseLeave={() => setHoveredRow(null)}>
                {item.name} {/* Text Display */}
                <img src={item.icon} alt={item.name} className="ml-2 w-5 h-5" /> {/* SVG Image Display */}
              </button>
              <button
                onClick={() => handleSelectRow(item)}
                className={`p-3 text-base mt-1 ${getClassName(item, "Distance")}`}
                onMouseEnter={() => setHoveredRow(item)}
                onMouseLeave={() => setHoveredRow(null)}>
                {item.quantity}
              </button>
              <button
                onClick={() => handleSelectRow(item)}
                className={`p-3 text-base mt-1 ${getClassName(item, "")}`}
                onMouseEnter={() => setHoveredRow(item)}
                onMouseLeave={() => setHoveredRow(null)}>
                {" "}
                {item.duration}
              </button>
              <button
                onClick={() => handleSelectRow(item)}
                className={`p-3 text-base mt-1 ${getClassName(item, "Right")}`}
                onMouseEnter={() => setHoveredRow(item)}
                onMouseLeave={() => setHoveredRow(null)}>
                {item.impact}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
