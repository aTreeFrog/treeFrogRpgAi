import React, { useState, useEffect, useRef } from "react";
import SkillSheet from "./SkillSheet";
import AttackSheet from "./AttackSheet";
import EquipmentSheet from "./EquipmentSheet";
import GiveSelect from "./GiveSelect";

export default function CharacterSheet({
  name,
  race,
  characterClass,
  level,
  activeSkill,
  activeTab,
  setActiveTab,
  player,
  selectedRow,
  setSelectedRow,
  isD20Spinning,
  equipmentRow,
  setEquipmentRow,
  setUsedEquipment,
  players,
  setGaveEquipment,
}) {
  const raceRef = useRef(null);
  const classRef = useRef(null);
  const [raceLineWidth, setRaceLineWidth] = useState("0px");
  const [classLineWidth, setClassLineWidth] = useState("0px");
  const frameCircle = "icons/framecircle.svg";
  const [giveSelection, setGiveSelection] = useState(false);
  const options = useRef([]);

  useEffect(() => {
    options.current = [];
    // go through each player and add the players (non enemies / npcs) as options to select from
    Object.values(players).forEach((data) => {
      // if (data.type == "player") {
      options.current.push({ value: data.name, label: data.name });
      // }
    });
  }, [players]);

  useEffect(() => {
    // Calculating for Race
    if (raceRef.current) {
      const textWidth = raceRef.current.offsetWidth;
      setRaceLineWidth(`${Math.ceil(textWidth * 1.5)}px`); // x percent more than text width
    }
    // Calculating for Class
    if (classRef.current) {
      const textWidth = classRef.current.offsetWidth;
      setClassLineWidth(`${Math.ceil(textWidth * 1.5)}px`); // x percent more than text width
    }
  }, [race, characterClass]); // Recalculate when race or class changes

  useEffect(() => {
    //if moved to another tab and didn't already select attack on target, clear out attack.
    if (activeTab != "Attacks/Spells" && player?.battleMode?.usersTargeted?.length < 1) {
      setSelectedRow(null);
    }

    //if didnt drink potion on battle turn, go ahead and set the row value to null when moving away
    if (activeTab != "Equipment" && !player?.battleMode?.drankPotion) {
      setEquipmentRow(null);
    }
  }, [activeTab]);

  const handleUseClick = () => {
    if (equipmentRow?.name) {
      console.log("equipmentRow.name", equipmentRow.name);
      setUsedEquipment(equipmentRow); // Update the state to true when the button is clicked
    }
  };

  const handleGiveSelection = (option) => {
    console.log("handleGiveSelection ", option);
    if (equipmentRow?.name) {
      const data = {
        itemName: equipmentRow.name,
        quantity: 1,
        playerGive: option.value,
        playerSent: player.name,
      };
      setGaveEquipment(data); // Update the state to true when the button is clicked
    }
  };

  return (
    <div className="mt-1 ml-4 text-left ">
      {" "}
      {/* Removed flex from this div */}
      {/* Container for both left and right sections */}
      <div className="flex items-start">
        {" "}
        {/* Add flex here */}
        {/* Left Section */}
        <div style={{ flex: "0 1 auto", maxWidth: "50%", marginRight: "20px" }}>
          <div className="mb-1 mt-5">
            {" "}
            {/* Wrapper for Name box and label */}
            <div className="bg-gray-800 relative inline-block p-3 text-white text-2xl font-bold rounded wavy-edges">{name}</div>
            <div className="text-white text-base ml-1 mt-[-4px]">Name</div>
          </div>
        </div>
        {/* Right Section */}
        <div
          style={{ flex: "1 1 auto", minWidth: "40%", marginRight: "20px" }}
          className="wavy-detail-box ml-0 mr-2 bg-gray-800 p-2 rounded flex flex-col justify-start items-start text-white h-[calc(2*3rem)] w-64 relative">
          {/* Dynamic Text for Race */}
          <div className="flex flex-col items-start mb-2">
            <span ref={raceRef} className="text-white text-base">
              {race}
            </span>
            <hr className="border-purple-800" style={{ width: raceLineWidth }} />
            <div className="text-white text-base">Race</div>
          </div>
          {/* Dynamic Text for Class */}
          <div className="flex flex-col items-start">
            <span ref={classRef} className="text-white text-base">
              {characterClass}
            </span>
            <hr className="border-purple-800" style={{ width: classLineWidth }} />
            <div className="text-white text-base">Class</div>
          </div>
          {/* Level Circle (Center-aligned) */}
          <div className="absolute top-1/2 transform -translate-y-1/2 right-8">
            <div
              className={`rounded-full h-16 w-16 ml-1 flex items-center justify-center border-2`}
              style={{
                backgroundColor: "rgba(139, 0, 0, 0.3)", // Semi-transparent amber background
                borderColor: "rgb(217, 119, 6)", // Solid amber border
              }}>
              <img
                src={player?.userImageUrl}
                className="rounded-full object-cover w-full h-full" // Adjusted classes here
                alt="Player" // Always include an alt attribute for accessibility
              />
            </div>

            <div className="text-white text-base text-center mt-2">Level {level}</div>
          </div>
        </div>
      </div>
      {/* New Rectangle below both sections */}
      <div
        className="relative block p-3 mt-7 text-white text-2xl font-bold text-medieval rounded wavy-edges"
        style={{ height: "37rem", width: "95%" }}>
        {activeTab == "Skills" && (
          <div>
            {/* Level Circle (Left and towards the top) */}
            <div className="absolute top-0 left-0 ml-3 mt-3">
              <img
                src={frameCircle}
                alt=""
                style={{ position: "absolute", zIndex: "2", marginLeft: "0px", marginTop: "0px", width: "60px", height: "60px" }}
                className="spin-icon"
              />
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  height: "60px",
                  width: "60px",
                  backgroundColor: "rgba(139, 0, 0, 0.3)" /* Semi-transparent amber background */,
                }}>
                <span className="text-white text-3xl">{level}</span>
              </div>
              <div className="text-white text-base text-center mt-1 ">Strength</div>
            </div>
            <div className="absolute top-0 left-0 ml-3 mt-3" style={{ marginTop: "calc(6rem + 12px)" }}>
              <img
                src={frameCircle}
                alt=""
                style={{ position: "absolute", zIndex: "2", marginLeft: "0px", marginTop: "0px", width: "60px", height: "60px" }}
                className="spin-icon"
              />
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  height: "60px",
                  width: "60px",
                  backgroundColor: "rgba(139, 0, 0, 0.3)" /* Semi-transparent amber background */,
                }}>
                <span className="text-white text-3xl">{level}</span>
              </div>
              <div className="text-white text-base text-center mt-1">Dexterity</div>
            </div>
            <div className="absolute top-0 left-0 ml-3 mt-3" style={{ marginTop: "calc(12rem + 12px)" }}>
              <img
                src={frameCircle}
                alt=""
                style={{ position: "absolute", zIndex: "2", marginLeft: "0px", marginTop: "0px", width: "60px", height: "60px" }}
                className="spin-icon"
              />
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  height: "60px",
                  width: "60px",
                  backgroundColor: "rgba(139, 0, 0, 0.3)" /* Semi-transparent amber background */,
                }}>
                <span className="text-white text-3xl">{level}</span>
              </div>
              <div className="text-white text-base text-center mt-1">Constitution</div>
            </div>
            <div className="absolute top-0 left-0 ml-3 mt-3" style={{ marginTop: "calc(18rem + 12px)" }}>
              <img
                src={frameCircle}
                alt=""
                style={{ position: "absolute", zIndex: "2", marginLeft: "0px", marginTop: "0px", width: "60px", height: "60px" }}
                className="spin-icon"
              />
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  height: "60px",
                  width: "60px",
                  backgroundColor: "rgba(139, 0, 0, 0.3)" /* Semi-transparent amber background */,
                }}>
                <span className="text-white text-3xl">{level}</span>
              </div>
              <div className="text-white text-base text-center mt-1">Intelligence</div>
            </div>
            <div className="absolute top-0 left-0 ml-3 mt-3" style={{ marginTop: "calc(24rem + 12px)" }}>
              <img
                src={frameCircle}
                alt=""
                style={{ position: "absolute", zIndex: "2", marginLeft: "0px", marginTop: "0px", width: "60px", height: "60px" }}
                className="spin-icon"
              />
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  height: "60px",
                  width: "60px",
                  backgroundColor: "rgba(139, 0, 0, 0.3)" /* Semi-transparent amber background */,
                }}>
                <span className="text-white text-3xl">{level}</span>
              </div>
              <div className="text-white text-base text-center mt-1">Wisdom</div>
            </div>
            <div className="absolute top-0 left-0 ml-3 mt-3" style={{ marginTop: "calc(30rem + 12px)" }}>
              <img
                src={frameCircle}
                alt=""
                style={{ position: "absolute", zIndex: "2", marginLeft: "0px", marginTop: "0px", width: "60px", height: "60px" }}
                className="spin-icon"
              />
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  height: "60px",
                  width: "60px",
                  backgroundColor: "rgba(139, 0, 0, 0.3)" /* Semi-transparent amber background */,
                }}>
                <span className="text-white text-3xl">{level}</span>
              </div>
              <div className="text-white text-base text-center mt-1">Charisma</div>
            </div>
          </div>
        )}
        {activeTab == "Attacks/Spells" && (
          <div className="absolute top-0 left-0 ml-3 mt-3">
            <div
              className="rounded-lg flex items-center justify-center border-2"
              style={{
                height: "5vw", // 5% of the viewport width
                width: "5vw", // 5% of the viewport width
                borderWidth: "0.375vw", // 0.375% of the viewport width
                backgroundColor:
                  player.battleMode.attackRollSucceeded === true
                    ? "rgb(0, 155, 0)"
                    : player.battleMode.attackRollSucceeded === false
                    ? "red"
                    : "rgb(0, 204, 215)",
                borderColor: "rgb(49, 46, 129)" /* Solid amber border */,
              }}>
              <img src="/icons/sword.svg" />
            </div>
            <div className="text-white text-base text-center mt-1 ">
              {player.battleMode.attackRollSucceeded === true
                ? "Success"
                : player.battleMode.attackRollSucceeded === false
                ? "Fail"
                : player.battleMode.attackRollSucceeded === null && selectedRow !== null
                ? "Selected"
                : player.battleMode.actionAttempted
                ? "Action Made"
                : ""}
            </div>
          </div>
        )}
        {activeTab == "Equipment" && (
          <div className="absolute top-0 left-0 ml-4 mt-3">
            <div className="flex items-start">
              <div>
                <div className="ml-12">Description</div>
                <div className="rounded-md w-[200px] flex items-center justify-center bg-gray-800 border-2 p-2 text-white text-sm overflow-hidden">
                  {equipmentRow?.description}
                </div>
              </div>
              <div className="flex space-x-3 ml-4 mt-4">
                <button
                  className={`bg-cyan-800 hover:bg-cyan-900 transition-colors duration-300 text-white font-bold py-1 px-6 rounded ${
                    !equipmentRow ||
                    equipmentRow?.quantity < 1 ||
                    (player?.mode == "battle" && (!player?.battleMode?.yourTurn || player?.battleMode?.usedPotion))
                      ? "opacity-50"
                      : ""
                  }`}
                  onClick={handleUseClick}
                  disabled={
                    !equipmentRow ||
                    equipmentRow?.quantity < 1 ||
                    (player?.mode == "battle" && (!player?.battleMode?.yourTurn || player?.battleMode?.usedPotion))
                  }>
                  Use
                </button>
                <button
                  className={`bg-purple-600 hover:bg-purple-800 transition-colors duration-300 text-white font-bold py-1 px-5 rounded ${
                    !equipmentRow ||
                    equipmentRow?.quantity < 1 ||
                    (player?.mode == "battle" && (!player?.battleMode?.yourTurn || player?.battleMode?.usedPotion))
                      ? "opacity-50"
                      : ""
                  }`}
                  onClick={() => setGiveSelection((prevGiveSelection) => !prevGiveSelection)}
                  disabled={
                    !equipmentRow ||
                    equipmentRow?.quantity < 1 ||
                    (player?.mode == "battle" && (!player?.battleMode?.yourTurn || player?.battleMode?.usedPotion))
                  }>
                  Give
                </button>
                {giveSelection === true && (
                  <div className="absolute bottom-full mb-2" style={{ position: "relative", zIndex: 2, flexGrow: 1 }}>
                    <GiveSelect options={options.current} onChange={handleGiveSelection} setGiveSelection={setGiveSelection} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab != "Equipment" && (
          <div>
            {/* Shield-shaped box */}
            <div
              className="shield-box rounded"
              style={{
                position: "absolute",
                top: "10%",
                left: "38%", // Adjusted left positioning
                transform: "translate(-62%, -50%)",
                width: "60px",
                height: "100px",
                backgroundColor: "purple",
                clipPath: "polygon(50% 0%, 100% 0, 100% 75%, 50% 100%, 0 75%, 0 0)" /* Adjust this to refine shape */,
                display: "flex", // Added for inner text alignment
                flexDirection: "column", // Added for inner text alignment
                justifyContent: "flex-end", // Aligns the content to the bottom
                alignItems: "center", // Centers the content horizontally
                padding: "4px", // Padding to ensure text doesn't touch the edges
              }}>
              {/* ... Other content inside the shield ... */}
              <div
                style={{
                  color: "white",
                  fontSize: "24px", // Adjust as needed
                  textAlign: "center",
                  width: "100%", // Ensure it's centered
                  marginBottom: "4px", // Space between the number and the text
                }}>
                16
              </div>
              <div
                style={{
                  color: "white",
                  fontSize: "14px", // Adjust as needed
                  textAlign: "center",
                  lineHeight: "18px",
                  marginBottom: "12px", // Adjust as needed to position the text from the bottom
                }}>
                Armor Class
              </div>
            </div>
            {/* New Initiative Box */}
            <div
              className="initiative-box rounded"
              style={{
                position: "absolute",
                top: "2%",
                left: "calc(30% + 70px)", // Positioned to the right of the shield
                width: "80px",
                height: "90px",
                backgroundColor: "rgba(200, 115, 45, 0.774)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "4px",
              }}>
              <div
                style={{
                  color: "white",
                  fontSize: "24px",
                  textAlign: "center",
                  marginBottom: "4px", // Space between the number and the text
                }}>
                + 4
              </div>
              {/* "Initiative" text */}
              <div
                style={{
                  color: "white",
                  fontSize: "16px",
                  textAlign: "center",
                }}>
                Initiative
              </div>
            </div>
            {/* Heart-shaped icon container */}
            <div
              style={{
                position: "absolute",
                top: "1%", // Adjust as needed
                left: "calc(42% + 120px)", // Adjust as needed
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}>
              {/* Text "Max: 35" above the heart */}
              <div
                style={{
                  fontSize: "20px",
                  color: "white",
                  marginBottom: "4px",
                }}>
                Max: 35
              </div>
              {/* Heart Shape with number "30" inside */}
              <div className="heart">
                <div className="heart-text">30</div>
              </div>
            </div>
          </div>
        )}
        <div
          className="flex align-self-end justify-end space-x-0.5 mt-70"
          style={{
            position: "absolute",
            top: "20%",
            left: "29%",
          }}>
          {["Skills", "Attacks/Spells", "Equipment"].map((tabName) => (
            <button
              key={tabName}
              className={`tab-button px-2 py-1 text-sm font-semibold border-2 border-transparent rounded-full transition-colors duration-300
                                ${activeTab === tabName ? "bg-purple-800" : "hover:bg-slate-800 opacity-90"}`}
              onClick={() => setActiveTab(tabName)}>
              {tabName}
            </button>
          ))}
        </div>
        {/* Container for skills/attacks/equipment */}
        {activeTab === "Skills" && (
          <div>
            <SkillSheet highlight={activeSkill} />
          </div>
        )}
        {activeTab === "Attacks/Spells" && (
          <div>
            <AttackSheet player={player} selectedRow={selectedRow} setSelectedRow={setSelectedRow} isD20Spinning={isD20Spinning} />
          </div>
        )}
        {activeTab === "Equipment" && (
          <div>
            <EquipmentSheet player={player} equipmentRow={equipmentRow} setEquipmentRow={setEquipmentRow} isD20Spinning={isD20Spinning} />
          </div>
        )}
      </div>
    </div>
  );
}
