import React, { useState, useEffect } from "react";
import { Stage, Layer, Image, Line, Text, Circle, Group } from "react-konva";
import useImage from "use-image";

const SmallMap = ({
  gridSpacing,
  className,
  players,
  userName,
}) => {
  const [image, status] = useImage(players[userName]?.smallMap?.mapUrl);
  const [scale, setScale] = useState(1); // Default scale is 1
  const [imageLoaded, setImageLoaded] = useState(false);

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

  // Function to draw buttons as circles
  const drawButtons = () => {
    if (!players[userName]?.smallMap?.buttons) return [];

    return players[userName].smallMap.buttons.map((button, index) => (
      <Group
        key={index}
        x={button.Location.X * gridSpacing + gridSpacing / 2}
        y={button.Location.Y * gridSpacing + gridSpacing / 2}
        onClick={() => console.log(button.Description)} // Example action on click
      >
        <Circle
          radius={15} // Adjust the radius as needed
          fill={"blue"} // Set fill color as needed
        />
        <Text
          text={button.Name || "Button"} // Fallback text if Name is empty
          fontSize={14}
          fontFamily={"Arial"}
          fill={"white"} // Text color
          offsetX={-30} // Center text horizontally. Adjust as needed based on text length
          offsetY={-7} // Center text vertically. Adjust as needed
        />
      </Group>
    ));
  };

  const animationClass = imageLoaded ? "fade-in" : "";

  return (
    <div
      className={`${className} ${animationClass}`}
      style={{
        cursor: "pointer",
      }}>
      {imageLoaded && (
        <Stage
          width={scale * (image ? image.width : 0)}
          height={scale * (image ? image.height : 0)}>
          <Layer>
            <Image image={image} scaleX={scale} scaleY={scale} />
            {drawButtons()}
          </Layer>
        </Stage>
      )}
    </div>
  );
};

export default SmallMap;
