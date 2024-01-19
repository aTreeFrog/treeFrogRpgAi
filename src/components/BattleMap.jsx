import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Circle } from 'react-konva';
import useImage from 'use-image';

const BattleMap = ({ src, gridSpacing, className }) => {
    const [image] = useImage(src);
    const [scale, setScale] = useState(1); // Default scale is 1
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
        const strokeWidth = 1.3;

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
        // Get the click position relative to the Stage
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        // Calculate the nearest grid cell center
        const gridX = Math.round(pointerPosition.x / gridSpacing - 0.5) * gridSpacing;
        const gridY = Math.round(pointerPosition.y / gridSpacing - 0.5) * gridSpacing;

        // Update the circle's position to the center of the cell
        setCirclePosition({ x: gridX + gridSpacing / 2, y: gridY + gridSpacing / 2 });
    };


    const handleDragEnd = (e) => {
        // Get the position of the center of the circle
        const circleCenterX = e.target.x() + gridSpacing / 2;
        const circleCenterY = e.target.y() + gridSpacing / 2;

        // Snap the center of the circle to the nearest grid cell center
        const snappedX = Math.round(circleCenterX / gridSpacing) * gridSpacing;
        const snappedY = Math.round(circleCenterY / gridSpacing) * gridSpacing;

        // Update the circle's position to the top-left of the cell
        setCirclePosition({ x: snappedX - gridSpacing / 2, y: snappedY - gridSpacing / 2 });
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
                        x={circlePosition.x}
                        y={circlePosition.y}
                        radius={gridSpacing / 3}
                        fill="green"
                        draggable
                        onDragEnd={handleDragEnd}
                    />
                </Layer>
            </Stage>
        </div>
    );
};

export default BattleMap;
