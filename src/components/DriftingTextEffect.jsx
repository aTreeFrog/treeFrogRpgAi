import React, { useState, useEffect, useRef } from "react";
import { Text, Image } from "react-konva";
import useImage from "use-image";

const DriftingTextEffect = ({ playerData, gridSpacing, showHealthChange }) => {
  const gridX = playerData.xPosition;
  const gridY = playerData.yPosition;
  const theX = gridX * gridSpacing + gridSpacing / 2; // Center of the cell horizontally
  const initialY = gridY * gridSpacing + gridSpacing / 4; // Center of the cell vertically
  const [textY, setTextY] = useState(initialY);
  const [opacity, setOpacity] = useState(1);
  const floatingText = useRef(""); // Use state to manage floatingText
  const animationRef = useRef();
  const ghostAnimationTime = 3000; // 6 seconds for the ghost to drift
  const textAnimationTime = 3000; // 3 seconds for text animation
  const startTimeRef = useRef(null);
  const [ghostImage] = useImage("/icons/ghost.svg");

  const animate = (timestamp) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsedTime = timestamp - startTimeRef.current;
    const totalAnimationTime = playerData.currentHealth <= 0 ? ghostAnimationTime : textAnimationTime;

    // Calculate new positions and opacity based on elapsed time
    const driftProgress = Math.min(1, elapsedTime / totalAnimationTime);
    const newY = initialY - (playerData.currentHealth <= 0 ? 40 : 0) - 50 * driftProgress; // Drift up 50 pixels but have ghosts start little higher up
    setTextY(newY);
    const newOpacity = 1 - driftProgress; // Fade out completely by the end of the animation
    setOpacity(newOpacity);

    if (elapsedTime < totalAnimationTime) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (playerData?.battleMode?.enemyAttackAttempt === "SUCCESS") {
      floatingText.current = "hit"; // Update state
      startTimeRef.current = null;
    } else if (playerData?.battleMode?.enemyAttackAttempt === "FAIL") {
      floatingText.current = "miss"; // Update state
      startTimeRef.current = null;
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []); // Dependency array is empty, so the effect runs once on mount

  useEffect(() => {
    if (showHealthChange.current[playerData.name]) {
      startTimeRef.current = null; // Start timer again for attack numbers.

      if (showHealthChange.current[playerData.name]?.type === "DECREASE") {
        floatingText.current = `-${showHealthChange.current[playerData.name].amount.toString()}`; // Ensure string representation
        animationRef.current = requestAnimationFrame(animate);
      } else if (showHealthChange.current[playerData.name]?.type === "INCREASE") {
        console.log("increased health showhealthchange");
        floatingText.current = `+${showHealthChange.current[playerData.name].amount.toString()}`; // Ensure string representation
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [showHealthChange.current[playerData.name]]); // React to changes in specific player's health change

  const shouldShowGhost = playerData.currentHealth <= 0;

  return shouldShowGhost ? (
    <Image x={theX - gridSpacing / 2.3} y={textY} image={ghostImage} width={gridSpacing / 1.2} height={gridSpacing / 1.2} opacity={opacity} />
  ) : (
    <Text
      x={theX - (playerData.battleMode.enemyAttackAttempt === "SUCCESS" ? gridSpacing / 4 : gridSpacing / 2.3)}
      y={textY}
      text={floatingText.current}
      fontSize={20}
      fill={showHealthChange.current[playerData.name]?.type === "INCREASE" ? "green" : "white"}
      opacity={opacity}
    />
  );
};

export default DriftingTextEffect;
