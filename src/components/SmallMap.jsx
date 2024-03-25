import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Line, Text, Circle, Group } from "react-konva";
import useImage from "use-image";

const SmallMap = ({ gridSpacing, className, players, userName }) => {
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

  const GlowButton = ({ button, scale, gridSpacing }) => {
    const buttonRef = useRef();
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
      const circle = buttonRef.current;
      let animating = true;
      let direction = 1;
      let blur = 10; // Initial shadowBlur value

      const animateGlow = () => {
        if (!animating) return;

        // Adjust the glow intensity
        blur += direction * 0.5;
        if (blur > 20 || blur < 10) {
          direction *= -1; // Change direction at min/max values
        }

        if (circle) {
          circle.shadowBlur(blur);
        }

        requestAnimationFrame(animateGlow);
      };

      animateGlow();

      return () => {
        animating = false; // Stop animation on component unmount
      };
    }, []);

    return (
      <Group
        x={button.Location.X * gridSpacing + gridSpacing / 2}
        y={button.Location.Y * gridSpacing + gridSpacing / 2}
        onClick={() => console.log(button.Description)}
        onMouseEnter={(e) => {
          const container = e.target.getStage().container();
          container.style.cursor = "pointer"; // Change cursor to pointer on hover
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage().container();
          container.style.cursor = ""; // Revert cursor to default on mouse leave
        }}>
        <Circle
          ref={buttonRef}
          radius={20}
          fill={"green"}
          stroke={"white"}
          strokeWidth={2}
          shadowColor={"orange"}
          shadowBlur={10}
          shadowOpacity={0.6}
        />
        <Text
          text={button.Type || ""}
          fontSize={14}
          fontFamily={"Arial"}
          fill={"white"}
          verticalAlign={"middle"} // Center align text vertically
          width={40} // Correcting the width to match text centering logic
          height={40} // Height to cover the text area
          offsetX={11} // Adjust offsetX to properly center the text
          offsetY={17} // Adj
        />
      </Group>
    );
  };

  const animationClass = imageLoaded ? "fade-in" : "";

  return (
    <>
      <div className={`${className} ${animationClass}`}>
        {imageLoaded && (
          <>
            <Stage width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}>
              <Layer>
                <Image image={image} scaleX={scale} scaleY={scale} />
                {/* {drawGrid()} */}
                {players[userName]?.smallMap?.buttons.map((button, index) => (
                  <GlowButton key={index} button={button} scale={scale} gridSpacing={gridSpacing} />
                ))}
              </Layer>
            </Stage>
          </>
        )}
      </div>
      <div className="rounded-lg border-2 border-purple-900 mt-3 bg-black bg-opacity-30 width-full ml-4 mr-4">
        <img src="/images/wizard_mononoculars.png" style={{ width: '30%' }} className="p-3 h-auto rounded-lg shadow-lg blur-text"></img>
      </div>
    </>
  );
};

export default SmallMap;
