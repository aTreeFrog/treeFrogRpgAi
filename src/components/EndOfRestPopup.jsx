import React from "react";

export default function EndOfRestPopup({ forceLongRestComplete, players }) {

  return (
    <div
      className="break-words overflow-wrap popup-glow border border-black fixed top-1/2 left-1/2 -translate-x-[55%] -translate-y-1/2 bg-purple-600 p-5 z-50 w-100 rounded-md text-center text-white"
      style={{ minWidth: "300px", maxWidth: "500px", height: "auto", maxHeight: "80vh", overflowY: "auto" }}>
      <pre>
        You have finished Long Rest Mode
        <br />
        Waiting for other players to complete
      </pre>
      {/* Display other players' selections */}
      <div className="mt-4">
        {Object.keys(players)
          .filter((name) => players[name].type === "player") // Filter players with mode "player"
          .map((name) => (
            <div key={name} className="mt-2">
              {players[name].name}: {players[name].mode == "endOfLongRest" ? "Ready" : "Waiting"}
              {players[name].mode != "endOfLongRest" && (
                <button className="ml-2 px-2 py-1 bg-red-500 text-white rounded-md" onClick={() => forceLongRestComplete(name)}>
                  Force Ready
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
