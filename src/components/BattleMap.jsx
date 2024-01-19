import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line } from 'react-konva';
import useImage from 'use-image';

const BattleMap = ({ src, gridSpacing, className }) => {
    const [image] = useImage(src);
    const [scale, setScale] = useState(1); // Default scale is 1

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

        // Horizontal lines
        for (let i = 0; i <= height; i += gridSpacing) {
            lines.push(<Line key={`h${i}`} points={[0, i, width, i]} stroke="black" />);
        }
        // Vertical lines
        for (let j = 0; j <= width; j += gridSpacing) {
            lines.push(<Line key={`v${j}`} points={[j, 0, j, height]} stroke="black" />);
        }
        return lines;
    };

    return (
        <div className={className}>
            <Stage width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}>
                <Layer>
                    <Image image={image} scaleX={scale} scaleY={scale} />
                    {drawGrid()}
                </Layer>
            </Stage>
        </div>
    );
};

export default BattleMap;
