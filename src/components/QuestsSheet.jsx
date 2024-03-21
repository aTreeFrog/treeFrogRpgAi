import React, { useState, useEffect, useRef } from "react";
import textFit from "textfit";

export default function QuestsSheet({ player, story }) {
  const [questTab, setQuestTab] = useState("Active");
  const [sideQuestTab, setSideQuestTab] = useState("Active Side Quests");
  const [sideQPicked, setSideQPicked] = useState();
  const textRef = useRef(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0); // Key to force update

  useEffect(() => {
    // Force a re-render by updating the key when the title changes
    setForceUpdateKey((prevKey) => prevKey + 1);
  }, [player?.quests?.scene?.title]);

  useEffect(() => {
    if (textRef.current) {
      textFit(textRef.current, {
        multiLine: false, // Encourage single line
        detectMultiLine: false,
        minFontSize: 10,
        maxFontSize: 100, // Adjust maxFontSize as needed
      });
    }
  }, [forceUpdateKey]);

  return (
    <div className="mt-1 ml-4">
      <div className="flex items-start text-white text-2xl justify-left ml-3 mb-1 opacity-70">
        <h1>Main Story Quest</h1>
      </div>
      <div>
        <hr className="w-11/12 border-t-[3px] border-yellow-700 rounded-sm" />
      </div>
      <div>
        <div className="bg-gray-500 bg-opacity-50 rounded-md p-2 mr-10 ml-1 mt-2 font-semibold">
          <p className="text-white text-md ml-2">Not yet discovered</p>
        </div>
      </div>
      <div
        key={forceUpdateKey}
        ref={textRef}
        className="flex items-start text-white text-2xl justify-left ml-3 mb-1 mt-1 opacity-70"
        style={{ width: "90%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <h1>Current Scene Quest: {player?.quests?.scene?.title}</h1>
      </div>
      <div>
        <hr className="w-11/12 border-t-[3px] border-yellow-700 rounded-sm" />
      </div>
      <div>
        <div className="bg-gray-500 bg-opacity-50 rounded-md p-2 mr-10 ml-1 mt-2 font-semibold">
          <p className="text-white text-md ml-2">{player?.quests?.scene?.description}</p>
        </div>
      </div>
      <div className="flex justify-center items-center gap-2 text-white mt-10 mr-20">
        {["Active Side Quests", "Completed Quests"].map((sideQuestTabName) => (
          <button
            key={sideQuestTabName}
            className={`tab-button px-2 py-1 text-sm font-semibold border-2 bg-gray-900 border-transparent rounded-full transition-colors duration-300
                                ${sideQuestTab === sideQuestTabName ? "bg-stone-700" : "hover:bg-stone-900 opacity-80"}`}
            onClick={() => setSideQuestTab(sideQuestTabName)}>
            {sideQuestTabName}
          </button>
        ))}
      </div>
      <div class="flex items-start mt-4">
        <div class="flex items-center text-white text-md">
          <button onClick={() => setSideQPicked("Legends of Sora")}>Legends of Sora</button>
        </div>
        <div class="w-1 bg-yellow-700 ml-2 self-stretch rounded-sm"></div>
      </div>
    </div>
  );
}
