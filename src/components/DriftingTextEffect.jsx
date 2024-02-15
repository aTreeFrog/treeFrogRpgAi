import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-konva';

const DriftingTextEffect = ({ playerData, gridSpacing, showHealthChange }) => {
    const gridX = playerData.xPosition;
    const gridY = playerData.yPosition;
    const theX = gridX * gridSpacing + gridSpacing / 2; // Center of the cell horizontally
    const initialY = gridY * gridSpacing + gridSpacing / 4; // Center of the cell vertically

    const [textY, setTextY] = useState(initialY);
    const [opacity, setOpacity] = useState(1);
    const animationRef = useRef();
    const totalAnimationTime = 3000; // Total time for the animation to complete (drift + fade)
    const startTimeRef = useRef(null);
    let floatingText = "";

    const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsedTime = timestamp - startTimeRef.current;

        // Calculate new positions and opacity based on elapsed time
        const driftProgress = Math.min(1, elapsedTime / totalAnimationTime);
        const newY = initialY - 50 * driftProgress * 2; // Drift up 50 pixels over the animation
        setTextY(newY);
        const newOpacity = 1 - driftProgress; // Fade out completely by the end of the animation
        setOpacity(newOpacity);

        if (elapsedTime < totalAnimationTime) {
            animationRef.current = requestAnimationFrame(animate);
        }
    };

    useEffect(() => {

        //set floating text. if attack made, show value of health change. otherwise show hit or miss
        //only show health change if the player enemyattackattempt was success. So it doesn't show for random people drinking potions
        if (playerData?.battleMode?.enemyAttackAttempt === 'SUCCESS' && showHealthChange[playerData.name] && showHealthChange[playerData.name]?.type == "INCREASE" || showHealthChange[playerData.name]?.type == "DECREASE") {
            floatingText = showHealthChange[playerData.name].amount;

        } else if (playerData?.battleMode?.enemyAttackAttempt === 'SUCCESS') {
            floatingText = "hit";
        } else if (playerData?.battleMode?.enemyAttackAttempt === 'FAIL') {
            floatingText = "miss";
        }

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, []); // Dependency array is empty, so the effect runs once on mount

    return (
        <Text
            x={theX - (playerData.battleMode.enemyAttackAttempt === 'SUCCESS' ? gridSpacing / 4 : gridSpacing / 2.3)} // Adjust to center text as needed
            y={textY}
            text={floatingText}
            fontSize={20} // Adjust fontSize as needed
            fill="white" // Text color
            opacity={opacity}
        />
    );
};

export default DriftingTextEffect;
