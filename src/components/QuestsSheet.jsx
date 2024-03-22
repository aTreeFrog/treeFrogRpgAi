import React, { useState, useEffect, useRef } from "react";
import textFit from "textfit";

export default function QuestsSheet({ player, story, sideQPicked, setSideQPicked }) {
  const [sideQuestTab, setSideQuestTab] = useState("Active Side Quests");
  const textRef = useRef(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0); // Key to force update
  const [isGlowing, setIsGlowing] = useState(false);

  useEffect(() => {
    // Force a re-render by updating the key when the title changes
    setForceUpdateKey((prevKey) => prevKey + 1);

    if (player?.quests?.scene?.title?.length > 0) {
      setIsGlowing(true);
    } else {
      setIsGlowing(false);
    }
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
      <div className="flex items-start text-white text-2xl justify-left ml-2 mb-1 opacity-70">
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
      <div className={`${isGlowing ? "quest-glow" : ""}`}>
        <div
          key={forceUpdateKey}
          ref={textRef}
          className="flex items-start text-white text-2xl justify-left ml-2 mb-1 mt-1 opacity-70"
          style={{ width: "90%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <h1>
            Current Scene Quest: <span style={{ fontSize: "80%" }}>{player?.quests?.scene?.title}</span>
          </h1>
        </div>
        <div>
          <hr className="w-11/12 border-t-[3px] border-yellow-700 rounded-sm" />
        </div>
        <div>
          <div className="bg-gray-500 bg-opacity-50 rounded-md p-2 mr-10 ml-1 mt-2 font-semibold">
            <p className="text-white text-md ml-2">
              {player?.quests?.scene?.description}{" "}
              <span className="opacity-70" style={{ fontSize: "80%" }}>
                ({player?.story?.act} : {player?.story?.scene})
              </span>
            </p>
          </div>
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
      {sideQuestTab === "Active Side Quests" && (
        <div className="flex items-start mt-6">
          <div className="flex">
            {/* Quest buttons and images */}
            <div className="flex flex-col justify-center items-center gap-2 text-white">
              {player?.quests?.activeSideQuests?.map((quest, index) => (
                <div key={index} className="flex items-center justify-start w-full">
                  <button
                    style={{ width: "7.0rem" }}
                    onClick={() => setSideQPicked(quest)} // Store the entire quest object
                    className={`px-2 py-1 text-xl rounded text-right opacity-70 font-semibold transition-colors duration-300 hover:bg-stone-800`}>
                    {quest.title || "Untitled Quest"}
                  </button>
                  <div className="w-6 pl-1 flex justify-start items-center">
                    {sideQPicked?.title === quest.title && <img src="/icons/bow.svg" width="24" height="24" alt="Bow Icon" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Yellow line */}
            <div className="w-1 bg-yellow-700 mx-2 self-stretch rounded-sm"></div>
          </div>

          {/* Description to the right of the yellow line */}
          {sideQPicked && (
            <div className="ml-4 text-white mr-4">
              <p className="break-words -mt-1">
                {sideQPicked.description}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
