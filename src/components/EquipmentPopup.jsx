import React from "react";

export default function EquipmentPopup({ equipment, equipmentInfo, setEquipmentInfo }) {
  return (
    <div className="break-words overflow-wrap popup-glow border border-black fixed top-1/2 left-1/2 -translate-x-[55%] -translate-y-1/2 bg-purple-600 p-5 z-50 w-100 rounded-md text-center text-white">
      {/* Centered part */}
      <div className="flex items-center justify-center mb-4">
        {" "}
        {/* Ensures centering */}
        <h1 className="mr-2">{equipment[equipmentInfo].name}</h1> {/* Added margin for spacing between text and icon */}
        <img className="inline-block" width="24" height="24" src={equipment[equipmentInfo].icon}></img>
      </div>
      {/* Description */}
      <pre className="mb-4">{equipment[equipmentInfo].description}</pre> {/* Increased separation from the description to the stats */}
      {/* Inline stats with increased separation */}
      <div className="flex justify-center items-center gap-4 mb-4">
        {" "}
        {/* Use gap for consistent spacing */}
        <pre>Type: {equipment[equipmentInfo].type}</pre>
        <pre>Impact: {equipment[equipmentInfo].impact}</pre>
        <pre>Duration: {equipment[equipmentInfo].duration}</pre>
      </div>
      {/* Button */}
      <div className="flex justify-around">
        <button className="font-semibold px-4 py-2 rounded bg-purple-900 text-white hover:bg-gray-600" onClick={() => setEquipmentInfo(null)}>
          Cool
        </button>
      </div>
    </div>
  );
}
