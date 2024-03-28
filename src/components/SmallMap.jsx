import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Line, Text, Circle, Group, Rect } from "react-konva";
import useImage from "use-image";
import textFit from "textfit";

const SmallMap = ({ gridSpacing, className, players, buttons, userName }) => {
  const [image, status] = useImage(players[userName]?.smallMap?.mapUrl);
  const [scale, setScale] = useState(1); // Default scale is 1
  const [imageLoaded, setImageLoaded] = useState(false);
  const isHovered = useRef(null);
  const selectedButton = useRef(null);
  const selectedImageURL = useRef("/images/wizard_mononoculars.png");
  const questData = useRef(null);
  const textRef = useRef(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0); // Key to force update

  useEffect(() => {
    if (status === "loaded") {
      setImageLoaded(true);
    }
  }, [status]);

  useEffect(() => {
    if (image) {
      // Calculate scale to fit the image into 1024x1024
      const newScale = Math.min(600 / image.width, 600 / image.height);
      setScale(newScale);
    }
  }, [image]);

  const drawGrid = () => {
    const lines = [];
    const width = scale * (image ? image.width : 0);
    const height = scale * (image ? image.height : 0);
    const strokeWidth = 0.5;

    // Horizontal lines
    for (let i = 0; i <= height; i += gridSpacing) {
      lines.push(<Line key={`h${i}`} points={[0, i, width, i]} stroke="black" strokeWidth={strokeWidth} />);
    }
    // Vertical lines
    for (let j = 0; j <= width; j += gridSpacing) {
      lines.push(<Line key={`v${j}`} points={[j, 0, j, height]} stroke="black" strokeWidth={strokeWidth} />);
    }
    return lines;
  };

  const imageCacheRef = useRef({});

  useEffect(() => {
    // Example loading function
    const loadImages = async () => {
      const iconPaths = ["/icons/sidequest.svg", "/icons/mainquest.svg"];
      const promises = iconPaths.map(
        (path) =>
          new Promise((resolve, reject) => {
            const img = new window.Image();
            img.src = path;
            img.onload = () => resolve({ path, img });
            img.onerror = reject;
          })
      );

      const images = await Promise.all(promises);
      images.forEach(({ path, img }) => {
        imageCacheRef.current[path] = img;
      });

      // Trigger a re-render if necessary, or update state to indicate images are loaded
    };

    loadImages();
  }, []); // Empty dependency array to run once on mount

  // Handler to update the selected button and image URL
  const handleButtonClick = (button) => {
    setForceUpdateKey((prevKey) => prevKey + 1);
    console.log("handleButtonClick");
    if (selectedButton.current === button.Name) {
      // If the same button is clicked again, deselect it and reset the image URL
      selectedButton.current = null;
      selectedImageURL.current = "/images/wizard_mononoculars.png";
      questData.current = null;
    } else {
      // Otherwise, update the selected button and its corresponding image URL
      selectedButton.current = button.Name;
      selectedImageURL.current = button.ImageUrl; // Assume each button has an ImageURL property

      let questType = "Side Quest";
      if (button.Type.toLowerCase().includes("main")) {
        questType = "Main Quest";
      }
      questData.current = {
        name: button.Name,
        description: button.Description,
        icon: button.Type,
        type: questType,
      };
    }
  };

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

  const animationClass = imageLoaded ? "fade-in" : "";

  return (
    <>
      <div className={`${className} ${animationClass}`} style={{ position: "relative" }}>
        {imageLoaded && (
          <>
            <Stage width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}>
              <Layer>
                <Image image={image} scaleX={scale} scaleY={scale} />
                {/* rawGrid()  */}
              </Layer>
            </Stage>
            {players[userName].smallMap.buttons.map((button, index) => (
              <div
                key={index} // It's better to move the key here for the list's root element
                className={selectedButton.current === button.Name ? "questbutton-glow" : ""}
                style={{
                  position: "absolute",
                  right: `${button.Location.X}`,
                  top: `${button.Location.Y}`,
                }}>
                <button
                  key={index}
                  onClick={() => handleButtonClick(button)}
                  style={{
                    // position: 'absolute',
                    // right: `${button.Location.X}`, // Use Location.X for the right property
                    // top: `${button.Location.Y}`, // Use Location.Y for the top property
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    backgroundColor: selectedButton.current === button.Name ? "lime" : "rgba(124, 58, 237)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "none",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
                    cursor: "pointer",
                    transition: "transform 0.3s ease",
                  }}
                  className={`focus:outline-none hover:scale-110`}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                  <img src={button.Type} alt="Button Icon" style={{ width: "60%", height: "auto" }} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="rounded-lg border-2 border-purple-900 mt-3 bg-black bg-opacity-30 width-full flex ml-4 mr-4 items-start">
        <img src={selectedImageURL.current} style={{ width: "30%" }} className="p-3 h-auto rounded-lg shadow-lg blur-text"></img>
        <div className="flex-1 flex flex-col justify-start ml-2 h-full">
          {questData.current?.name?.length > 0 && (
            <>
              <div className="flex items-center mb-1 opacity-70">
                <div key={forceUpdateKey} ref={textRef} className="text-white text-2xl">
                  <h1>{questData?.current?.name}</h1>
                </div>
                {/* Progress Bar Container */}
                <div className="flex-1 mx-4 mt-1 bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: "10%" }}>
                    {" "}
                    {/* Adjust width based on progress */}
                  </div>
                </div>
                {/* Scenes Completed Indicator */}
                <div className="text-white text-sm mr-2">
                  <span>0/5 scenes done</span>
                </div>
              </div>
              <div className="w-full">
                <hr className="border-t-[3px] border-yellow-700 rounded-sm" />
              </div>
            </>
          )}
          <div className="opacity-90 mr-10 mt-2 font-semibold">
            <p className="text-white text-md">{questData.current ? questData.current?.description : "Choose your objective adventurer"}</p>
          </div>
          <div className="flex-1">
            {" "}
            {/* Spacer div to push content to bottom */}
            {/* This div will grow to take up all available space, pushing subsequent content to the bottom */}
          </div>
          {questData?.current?.icon.length > 0 && (
            <div className="flex-1 flex justify-start items-center">
              <p className="text-white text-md mr-3">{questData?.current?.type} </p>
              <img src={questData?.current?.icon} width="24" height="24"></img>
              <button  className="text-white font-bold text-md ml-auto mr-5 mb-3 bg-stone-700 hover:bg-lime-600 rounded-lg px-4 py-2 focus:outline-none transition-colors duration-300" 
                >Start</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SmallMap;
