import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Line, Text, Circle, Group, Rect } from "react-konva";
import useImage from "use-image";

const SmallMap = ({ gridSpacing, className, players, buttons, userName }) => {
  const [image, status] = useImage(players[userName]?.smallMap?.mapUrl);
  const [scale, setScale] = useState(1); // Default scale is 1
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const isHovered = useRef(null);
  const selectedButton = useRef(null);
  const selectedImageURL = useRef("/images/wizard_mononoculars.png");

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
    console.log("handleButtonClick");
    if (selectedButton.current === button.Name) {
      // If the same button is clicked again, deselect it and reset the image URL
      selectedButton.current = null;
      selectedImageURL.current = "/images/wizard_mononoculars.png";
    } else {
      // Otherwise, update the selected button and its corresponding image URL
      selectedButton.current = button.Name;
      selectedImageURL.current = button.ImageURL; // Assume each button has an ImageURL property
    }
  };

  // Custom deep comparison function for React.memo

  const GlowButton = React.memo(({ button, scale, gridSpacing, setHoveredButton, hoveredButton }) => {
    // Add padding around the text for the background rectangle
    const padding = 4;
    const [textSize, setTextSize] = useState({ width: 0, height: 0 });
    // Define the size of the text for calculating the background size. Adjust as needed.
    // const textSize = { width: 100, height: 20 }; // Example sizes, adjust based on actual needs

    useEffect(() => {
      // Create a temporary Text node to measure text
      const tempText = new window.Konva.Text({
        text: button.Name,
        fontSize: 16,
        fontFamily: "Arial",
      });
      // Update state with actual size
      setTextSize({ width: tempText.width(), height: tempText.height() });
    }, [button.Name]);

    //this part prevents the flickering of the icons
    const getIconPath = React.useCallback(() => {
      switch (button.Type) {
        case "SQ":
          return "/icons/sidequest.svg";
        case "MQ":
          return "/icons/mainquest.svg";
        default:
          return ""; // default icon or empty string if none
      }
    }, [button.Type]);

    const iconPath = React.useMemo(() => getIconPath(), [getIconPath]);
    const icon = imageCacheRef.current[iconPath];
    // Determine if the current button is the selected one
    const isSelected = selectedButton.current === button.Name;

    if (hoveredButton === button.Name) {
      isHovered.current = button.Name;
    } else {
      isHovered.current = null;
    }

    // Helper function to dynamically load the SVG icon based on the button type

    // useEffect(() => {
    // let animating = true;
    // let direction = 1;
    // let blur = 10; // Initial shadowBlur value

    //   const animateGlow = () => {
    //     if (!animating) return;

    //     blur += direction * 0.5;
    //     if (blur > 20 || blur < 10) {
    //       direction *= -1;
    //     }

    //     if (buttonRef.current) {
    //       buttonRef.current.shadowBlur(blur);
    //     }

    //     requestAnimationFrame(animateGlow);
    //   };

    //   animateGlow();

    //   return () => {
    //     animating = false;
    //   };
    // }, []);

    return (
      <Group
        x={button.Location.X * gridSpacing + gridSpacing / 2}
        y={button.Location.Y * gridSpacing + gridSpacing / 2}
        onClick={() => handleButtonClick(button)}
        onMouseEnter={(e) => {
          setHoveredButton(button.Name);
          const container = e.target.getStage().container();
          container.style.cursor = "pointer"; // Change cursor to pointer on hover
        }}
        onMouseLeave={(e) => {
          setHoveredButton(null);
          const container = e.target.getStage().container();
          container.style.cursor = ""; // Revert cursor to default on mouse leave
        }}>
        <Circle
          // ref={buttonRef}
          radius={20}
          fill={isSelected ? "green" : "blue"} // Change color based on selection
          opacity={isSelected ? 1.0 : 0.5} // Change opacity based on selection
          // stroke={"white"}
          // strokeWidth={2}
          shadowColor={"red"}
          shadowBlur={10}
          shadowOpacity={0.6}
        />
        {icon && (
          <Image
            image={icon}
            x={-15} // Adjust these values to position the icon correctly
            y={-16}
            width={30} // Adjust if necessary to fit the circle
            height={30}
          />
        )}
        {isHovered.current && (
          <>
            <Rect
              width={textSize.width + padding * 2} // Total width including padding
              height={textSize.height + padding * 2} // Total height including padding
              offsetY={45}
              offsetX={75}
              // x={button.Location.X * gridSpacing + gridSpacing / 2 - (textSize.width + padding * 2) / 2} // Center horizontally based on button location
              // y={button.Location.Y * gridSpacing + gridSpacing / 2 - 45 - (textSize.height + padding * 2)} // Place above the circle
              fill="purple"
              cornerRadius={5}
            />
            <Text
              text={button.Name}
              fontSize={16}
              fontFamily={"Arial"}
              fill={"white"}
              align={"center"}
              offsetY={40}
              offsetX={72}
              // Center text in the rectangle
              // x={button.Location.X * gridSpacing + gridSpacing / 2 - textSize.width / 2} // Adjust so text is centered within the rectangle
              // y={button.Location.Y * gridSpacing + gridSpacing / 2 - 45 - textSize.height - padding} // Adjust so text appears in the center of the rectangle
            />
          </>
        )}
      </Group>
    );
  });

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
                {buttons.map((button, index) => (
                  <GlowButton
                    key={button.Name}
                    button={button}
                    scale={scale}
                    gridSpacing={gridSpacing}
                    setHoveredButton={setHoveredButton}
                    hoveredButton={hoveredButton}
                  />
                ))}
              </Layer>
            </Stage>
          </>
        )}
      </div>
      <div className="rounded-lg border-2 border-purple-900 mt-3 bg-black bg-opacity-30 width-full ml-4 mr-4">
        <img src={selectedImageURL.current} style={{ width: "30%" }} className="p-3 h-auto rounded-lg shadow-lg blur-text"></img>
      </div>
    </>
  );
};

export default SmallMap;
