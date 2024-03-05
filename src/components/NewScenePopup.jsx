import React from "react";

export default function NewScenePopup({ newSceneReady, players, userName }) {
  // Dynamically style the "Yes" button based on the current player's readiness
  const yesButtonStyle = players[userName]?.newSceneReady
    ? "bg-green-500 hover:bg-green-700" // Indicate readiness with green color
    : "bg-purple-900 hover:bg-gray-600"; // Default style

  return (
    <div
      className="break-words overflow-wrap popup-glow border border-black fixed top-1/2 left-1/2 -translate-x-[55%] -translate-y-1/2 bg-purple-600 p-5 z-50 w-100 rounded-md text-center text-white"
      style={{ minWidth: "300px", maxWidth: "500px", height: "auto", maxHeight: "80vh", overflowY: "auto" }}>
      <pre>
        New Scene Starting
        <br />
        Are you ready?
      </pre>
      <div className="flex justify-around mt-4">
        <button className={`font-semibold px-4 py-2 rounded text-white rounded-md ${yesButtonStyle}`} onClick={() => newSceneReady(userName)}>
          Yes
        </button>
      </div>
      {/* Display other players' selections */}
      <div className="mt-4">
        {Object.keys(players)
          .filter((name) => players[name].mode === "player") // Filter players with mode "player"
          .map((name) => (
            <div key={name} className="mt-2">
              {players[name].name}: {players[name].newSceneReady ? "Ready" : "Waiting"}
              {!players[name].newSceneReady && (
                <button className="ml-2 px-2 py-1 bg-red-500 text-white rounded-md" onClick={() => newSceneReady(name)}>
                  Force Ready
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
