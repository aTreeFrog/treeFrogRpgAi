import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Circle } from 'react-konva';
import useImage from 'use-image';

const BattleMap = ({ src, gridSpacing, className }) => {
    const [image] = useImage(src);
    const [scale, setScale] = useState(1); // Default scale is 1
    const [wizardIcImage] = useImage('/icons/wizard.svg');

    // put this in an object that comes into the function
    const gridX = 2; // Column
    const gridY = 2; // Row
    const [travelZonePosition, setTravelZonePosition] = useState({ x: 150, y: 200 }); // Default position

    const travelZoneRadius = 200;

    const [wizardScale, setWizardScale] = useState(1);
    const wizardSize = wizardIcImage?.width * wizardScale;
    // Translate to pixel coordinates
    const pixelX = gridX * gridSpacing + gridSpacing / 2;
    const pixelY = gridY * gridSpacing + gridSpacing / 2;

    // Initial circle position state
    const [wizardPosition, setWizardPosition] = useState({ x: pixelX, y: pixelY });


    // Calculate wizard scale after image is loaded
    useEffect(() => {
        if (wizardIcImage) {
            const desiredWizardSize = gridSpacing * 0.8; // Adjust as needed
            const newScale = desiredWizardSize / wizardIcImage.width;
            setWizardScale(newScale);
            const wizardSize = wizardIcImage.width * newScale;
            const initialX = gridX * gridSpacing + gridSpacing / 2 - wizardSize / 2;
            const initialY = gridX * gridSpacing + gridSpacing / 2 - wizardSize / 2;
            setWizardPosition({ x: initialX, y: initialY });
        }
    }, [wizardIcImage, gridSpacing]);


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

    const handleClick = (e) => {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        // Calculate distance from the click position to the center of the travel zone
        const distance = Math.sqrt(
            Math.pow(pointerPosition.x - travelZonePosition.x, 2) +
            Math.pow(pointerPosition.y - travelZonePosition.y, 2)
        );

        if (distance <= travelZoneRadius) {
            // Calculate the top-left of the nearest grid cell
            const gridX = Math.floor(pointerPosition.x / gridSpacing) * gridSpacing;
            const gridY = Math.floor(pointerPosition.y / gridSpacing) * gridSpacing;

            // Center the wizard in the grid cell
            setWizardPosition({ x: gridX + gridSpacing / 2 - wizardSize / 2, y: gridY + gridSpacing / 2 - wizardSize / 2 });
        }
    };

    const handleDragEnd = (e) => {
        // Get the position of the dragged icon
        const wizardX = e.target.x();
        const wizardY = e.target.y();

        // Calculate distance from the wizard's center to the center of the travel zone
        const distance = Math.sqrt(
            Math.pow(wizardX - travelZonePosition.x, 2) +
            Math.pow(wizardY - travelZonePosition.y, 2)
        );

        if (distance <= travelZoneRadius) {
            // Calculate the center of the nearest grid cell
            // We use Math.round here to snap to the nearest grid cell based on the icon's current position
            const centerGridX = Math.round(wizardX / gridSpacing) * gridSpacing;
            const centerGridY = Math.round(wizardY / gridSpacing) * gridSpacing;

            // Adjust the wizard's position to the center of the cell
            // Subtract half the wizard's size to align the center of the wizard with the center of the cell
            setWizardPosition({ x: centerGridX + gridSpacing / 2 - wizardSize / 2, y: centerGridY + gridSpacing / 2 - wizardSize / 2 });
        } else {
            // Revert to original position if the wizard is dragged outside the travel zone
            e.target.to({
                x: wizardPosition.x,
                y: wizardPosition.y,
                duration: 0.2 // Transition duration in seconds
            });
        }
    };

    return (
        <div className={className}>
            <Stage
                onClick={handleClick} width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}
            >
                <Layer>
                    <Image image={image} scaleX={scale} scaleY={scale} />
                    {drawGrid()}
                    <Circle
                        x={travelZonePosition.x}
                        y={travelZonePosition.y}
                        radius={travelZoneRadius} // Larger radius for the travel zone
                        fill="rgba(255, 255, 0, 0.5)" // Semi-transparent yellow
                    />
                    <Image
                        image={wizardIcImage}
                        x={wizardPosition.x}
                        y={wizardPosition.y}
                        radius={gridSpacing / 3}
                        // fill="green"
                        draggable
                        onDragEnd={handleDragEnd}
                        scaleX={wizardScale}
                        scaleY={wizardScale}
                    />
                </Layer>
            </Stage>
        </div>
    );
};

export default BattleMap;
