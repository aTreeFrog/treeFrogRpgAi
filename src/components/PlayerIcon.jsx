// components/PlayerIcon.jsx
import React, { useState } from 'react';
import useImage from 'use-image';
import { Layer, Image, Circle } from 'react-konva';
const PlayerIcon = ({ playerName, playerData, gridSpacing, userName, imageLoaded, updatePlayerData, travelZoneRadius, clickable, unavailCoord, selectedRow }) => {
    const [image] = useImage(playerData.figureIcon);

    // takes into account amount a player moved during their turn
    let travelZone = travelZoneRadius * (playerData?.distance - playerData?.battleMode?.distanceMoved);

    if (!image) {
        return null; // Or some placeholder
    }

    const animationClass = imageLoaded ? 'bubble-in' : '';
    const playerScale = gridSpacing * 0.8 / image.width;
    const playerSize = image.width * playerScale;
    const gridX = playerData.xPosition;
    const gridY = playerData.yPosition;
    const pixelX = gridX * gridSpacing + gridSpacing / 2 - playerSize / 2;
    const pixelY = gridY * gridSpacing + gridSpacing / 2 - playerSize / 2;
    const circleX = gridX * gridSpacing + gridSpacing / 2;
    const circleY = gridY * gridSpacing + gridSpacing / 2;

    const handleDragEnd = (e) => {
        // Get the position of the dragged icon
        const playerX = e.target.x();
        const playerY = e.target.y();

        // Calculate distance from the wizard's center to the center of the travel zone
        const distance = Math.sqrt(
            Math.pow(playerX - pixelX, 2) +
            Math.pow(playerY - pixelY, 2)
        );

        const myX = Math.round(playerX / gridSpacing);
        const myY = Math.round(playerY / gridSpacing);

        console.log("key ", playerName);
        console.log("userName ", userName)

        //ensures coordinate moving to is not taken by another player
        const isUnavailable = unavailCoord.some(coord => {
            return coord[0] === myX && coord[1] === myY;
        });


        if (!isUnavailable && (distance <= travelZone && playerName == userName)) {
            // Calculate the center of the nearest grid cell
            // We use Math.round here to snap to the nearest grid cell based on the icon's current position

            console.log("myX  myY", myX, myY);

            //update x and y position of the player object
            updatePlayerData(myX, myY);

            // // Adjust the wizard's position to the center of the cell
            // // Subtract half the wizard's size to align the center of the wizard with the center of the cell
            // setWizardPosition({ x: centerGridX + gridSpacing / 2 - wizardSize / 2, y: centerGridY + gridSpacing / 2 - wizardSize / 2 });
        } else {
            // Revert to original position if the wizard is dragged outside the travel zone
            e.target.to({
                x: pixelX,
                y: pixelY,
                duration: 0.2 // Transition duration in seconds
            });
        }
    };

    return (
        <>
            {playerData.type !== 'enemy' && clickable && (
                <Circle
                    x={circleX}
                    y={circleY}
                    radius={travelZone} // Larger radius for the travel zone
                    fill="rgba(255, 255, 0, 0.3)" // Semi-transparent yellow
                    className={animationClass}
                />
            )}
            <Image
                image={image}
                x={pixelX}
                y={pixelY}
                scaleX={playerScale}
                scaleY={playerScale}
                draggable={clickable}
                onDragEnd={(e) => clickable && handleDragEnd(e)}
            />
        </>
    );
};

export default PlayerIcon;
