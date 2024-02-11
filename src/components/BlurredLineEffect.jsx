import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-konva';

const BlurredLineEffect = ({ playerData, gridSpacing }) => {
    const gridX = playerData.xPosition;
    const gridY = playerData.yPosition;
    const theX = gridX * gridSpacing + gridSpacing / 10;
    const theY = gridY * gridSpacing; // Center of the cell vertically
    const cellTop = theY + gridSpacing / 10; // Top boundary of the cell
    const cellBottom = theY + gridSpacing - gridSpacing / 10; // Bottom boundary of the cell
    const cellWidth = gridSpacing - gridSpacing / 5;

    const [lineY, setLineY] = useState(theY); // Start from the center of the cell
    const animationRef = useRef();
    const directionRef = useRef(1); // Initial direction down

    const animate = (time) => {
        setLineY(prevY => {
            let newY = prevY + directionRef.current * 0.5; // Adjust this for speed
            if (newY >= cellBottom || newY <= cellTop) {
                directionRef.current *= -1; // Change direction
                newY = newY >= cellBottom ? cellBottom : cellTop; // Ensure staying within bounds
            }
            return newY;
        });

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationRef.current);
    }, []); // Empty dependency array means this effect runs once on mount

    // Points for the moving line, adjusted for vertical movement within the cell
    const linePoints = [theX, lineY, theX + cellWidth, lineY];

    return (
        <>
            {/* Wide, semi-transparent line for the blurred background */}
            <Line
                points={linePoints}
                stroke="white"
                strokeWidth={3} // Width of the blur
                opacity={0.6}
                lineCap="butt"
                lineJoin="round"
                shadowBlur={10} // Blur effect
                shadowColor="white"
            />
        </>
    );
};

export default BlurredLineEffect;
