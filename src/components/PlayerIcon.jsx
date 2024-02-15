// components/PlayerIcon.jsx
import React, { useState } from 'react';
import useImage from 'use-image';
import { Layer, Image, Circle, Rect, Text, Group } from 'react-konva';
const PlayerIcon = ({ playerName, playerData, gridSpacing, userName, imageLoaded, updatePlayerData, travelZoneRadius, clickable, unavailCoord, showPlayerName, setShowPlayerName, selectedRow, circleStop, showEnemyResult, setShowEnemyResult }) => {
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
    const pixelX = gridX * gridSpacing + gridSpacing / 2 - playerSize / 2 * playerData.xScale;
    const pixelY = gridY * gridSpacing + gridSpacing / 2 - playerSize / 2;
    const circleX = gridX * gridSpacing + gridSpacing / 2;
    const circleY = gridY * gridSpacing + gridSpacing / 2;

    const tooltipPadding = 1;
    const tooltipFontSize = 14;
    const tooltipFontFamily = 'Arial';
    const tooltipTextColor = 'white';

    // Calculate tooltip background size based on text
    const tooltipTextWidth = playerData.name.length * (tooltipFontSize / 2); // Approximation
    const tooltipWidth = tooltipTextWidth;
    const tooltipHeight = tooltipFontSize;

    // calculate width of success and failed background
    const hitWidth = ("hit".length * (tooltipFontSize / 2)) / 2;
    const missedWidth = ("miss".length * (tooltipFontSize / 2)) / 2;


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


        //ensures coordinate moving to is not taken by another player
        const isUnavailable = unavailCoord.some(coord => {
            return coord[0] === myX && coord[1] === myY;
        });


        if (!isUnavailable && (distance <= travelZone && playerName == userName) && playerData.battleMode.yourTurn) {
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

    const handleMouseOver = (e) => {

        // dont show player name when attack circle is moving, its distracting
        if (selectedRow && !circleStop) {
            setShowPlayerName(prevState => ({
                ...prevState,
                [playerData.name]: false
            }));
        } else {

            setShowPlayerName(prevState => ({
                ...prevState,
                [playerData.name]: true
            }));
        }
    };

    const handleMouseOut = () => {
        setShowPlayerName(prevState => ({
            ...prevState,
            [playerData.name]: false
        }));
    };

    return (
        <>
            {playerData.battleMode.targeted && (
                <Rect
                    x={circleX - 22}
                    y={circleY - 22}
                    width={gridSpacing} // Width of the rectangle, twice the radius to mimic a square with the same diameter as the circle
                    height={gridSpacing} // Height of the rectangle, same as width for a square
                    fill="rgba(235, 48, 67, 0.7)" // Semi-transparent yellow
                    shadowColor="rgba(235, 48, 67, 0.5)"
                    shadowBlur={10}
                    shadowOpacity={1}
                    opacity={0.9}
                    cornerRadius={10}
                />
            )}
            <Image
                image={image}
                x={pixelX}
                y={pixelY}
                scaleX={playerScale * playerData.xScale}
                scaleY={playerScale}
                draggable={clickable}
                onDragEnd={(e) => clickable && handleDragEnd(e)}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
            />
            {showPlayerName[playerName] === true && showEnemyResult[playerName] != "SUCCESS" && showEnemyResult[playerName] != "FAIL" && (
                // moveToTop ensures proper zindex for this group since zindex itself did not work
                <Group ref={node => node && node.moveToTop()}>
                    <Rect
                        x={circleX - ((tooltipWidth / 2))}
                        y={circleY - gridSpacing / 1.2}
                        width={tooltipWidth + 2}
                        height={tooltipHeight + 2}
                        fill={playerData.type === 'enemy' ? 'red' : 'green'}
                        cornerRadius={4}
                    />
                    <Text
                        x={circleX + tooltipPadding - ((tooltipWidth / 2))}
                        y={circleY + tooltipPadding - gridSpacing / 1.2}
                        text={playerData.name}
                        fontSize={tooltipFontSize}
                        fontFamily={tooltipFontFamily}
                        fill={tooltipTextColor}
                    />
                </Group>
            )}
            {/* {showEnemyResult[playerName] && (showEnemyResult[playerName] == "SUCCESS" || showEnemyResult[playerName] == "FAIL") && (
                // moveToTop ensures proper zindex for this group since zindex itself did not work
                <Group ref={node => node && node.moveToTop()}>
                    <Rect
                        x={circleX - ((showEnemyResult[playerName] === 'SUCCESS' ? hitWidth : missedWidth))}
                        y={circleY - gridSpacing / 1.2}
                        width={((showEnemyResult[playerName] === 'SUCCESS' ? hitWidth * 2 : missedWidth * 2)) + 2}
                        height={tooltipHeight + 2}
                        fill={showEnemyResult[playerName] === 'SUCCESS' ? 'green' : 'red'}
                        cornerRadius={4}
                        shadowBlur={10} // Adjust the glow effect's blur radius
                        shadowColor={showEnemyResult[playerName] === 'SUCCESS' ? 'green' : 'red'} // Use the same color for the glow to match the fill
                        shadowOffsetX={0} // No horizontal offset
                        shadowOffsetY={0} // No vertical offset
                        shadowOpacity={0.7} // Adjust the shadow (glow) opacity
                    />
                    <Text
                        x={circleX + 1 + tooltipPadding - ((showEnemyResult[playerName] === 'SUCCESS' ? hitWidth : missedWidth))}
                        y={circleY + tooltipPadding - gridSpacing / 1.2}
                        text={showEnemyResult[playerName] === 'SUCCESS' ? 'hit' : 'miss'}
                        fontSize={tooltipFontSize}
                        fontFamily={tooltipFontFamily}
                        fill={tooltipTextColor}
                        shadowColor={'black'} // Choose a contrasting shadow color
                        shadowBlur={5}
                        shadowOffsetX={2}
                        shadowOffsetY={2}
                        shadowOpacity={0.7}
                    />
                </Group>
            )} */}
        </>
    );
};

export default PlayerIcon;
