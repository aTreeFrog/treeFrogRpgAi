import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Circle } from 'react-konva';
import useImage from 'use-image';

const BattleMap = ({ src, gridSpacing, className }) => {
    const [image] = useImage(src);
    const [scale, setScale] = useState(1); // Default scale is 1
    const [wizardIcImage] = useImage('/icons/wizard.svg');
    const wizardScale = 45 / wizardIcImage?.width;
    const wizardSize = wizardIcImage?.width * wizardScale;
    // Specific grid coordinates
    const gridX = 1; // Column
    const gridY = 1; // Row


    // Translate to pixel coordinates
    const pixelX = gridX * gridSpacing + gridSpacing / 2;
    const pixelY = gridY * gridSpacing + gridSpacing / 2;

    // Initial circle position state
    const [circlePosition, setCirclePosition] = useState({ x: pixelX, y: pixelY });


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

        // Calculate the top-left of the nearest grid cell
        const gridX = Math.floor(pointerPosition.x / gridSpacing) * gridSpacing;
        const gridY = Math.floor(pointerPosition.y / gridSpacing) * gridSpacing;

        // Center the wizard in the grid cell
        setCirclePosition({ x: gridX + gridSpacing / 2 - wizardSize / 2, y: gridY + gridSpacing / 2 - wizardSize / 2 });
    };

    const handleDragEnd = (e) => {
        // Get the position of the dragged icon
        const wizardX = e.target.x();
        const wizardY = e.target.y();

        // Calculate the center of the nearest grid cell
        // We use Math.round here to snap to the nearest grid cell based on the icon's current position
        const centerGridX = Math.round(wizardX / gridSpacing) * gridSpacing;
        const centerGridY = Math.round(wizardY / gridSpacing) * gridSpacing;

        // Adjust the wizard's position to the center of the cell
        // Subtract half the wizard's size to align the center of the wizard with the center of the cell
        setCirclePosition({ x: centerGridX + gridSpacing / 2 - wizardSize / 2, y: centerGridY + gridSpacing / 2 - wizardSize / 2 });
    };



    return (
        <div className={className}>
            <Stage
                onClick={handleClick} width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}
            >
                <Layer>
                    <Image image={image} scaleX={scale} scaleY={scale} />
                    {drawGrid()}
                    <Image
                        image={wizardIcImage}
                        x={circlePosition.x}
                        y={circlePosition.y}
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
