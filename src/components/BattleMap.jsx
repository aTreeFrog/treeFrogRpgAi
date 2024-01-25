import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import PlayerIcon from '../components/PlayerIcon';

const BattleMap = ({ gridSpacing, className, players, setPlayers, userName }) => {
    const [image, status] = useImage(players[userName]?.battleMode.mapUrl);
    const [scale, setScale] = useState(1); // Default scale is 1
    //const [wizardIcImage] = useImage('/icons/wizard.svg'); //13 by 13 grid
    const [imageLoaded, setImageLoaded] = useState(false);

    // useEffect(() => {
    //     setInternalPlayerIcons(players)
    // }, [players]);


    // put this in an object that comes into the function
    // const gridX = 2; // Column
    // const gridY = 2; // Row
    // const [travelZonePosition, setTravelZonePosition] = useState({ x: 150, y: 200 }); // Default position

    // const travelZoneRadius = 200;

    // const [wizardScale, setWizardScale] = useState(1);
    // const wizardSize = wizardIcImage?.width * wizardScale;
    // // Translate to pixel coordinates
    // const pixelX = gridX * gridSpacing + gridSpacing / 2;
    // const pixelY = gridY * gridSpacing + gridSpacing / 2;

    // // Initial circle position state
    // const [wizardPosition, setWizardPosition] = useState({ x: pixelX, y: pixelY });

    useEffect(() => {
        if (status === 'loaded') {
            setImageLoaded(true);
            console.log("image battlemap: ", image);
        }

    }, [status]);


    // Calculate wizard scale after image is loaded
    // useEffect(() => {
    //     if (wizardIcImage) {
    //         const desiredWizardSize = gridSpacing * 0.8; // Adjust as needed
    //         const newScale = desiredWizardSize / wizardIcImage.width;
    //         setWizardScale(newScale);
    //         const wizardSize = wizardIcImage.width * newScale;
    //         const initialX = gridX * gridSpacing + gridSpacing / 2 - wizardSize / 2;
    //         const initialY = gridX * gridSpacing + gridSpacing / 2 - wizardSize / 2;
    //         setWizardPosition({ x: initialX, y: initialY });
    //     }
    // }, [wizardIcImage, gridSpacing]);


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

    // const handleClick = (e) => {
    //     const stage = e.target.getStage();
    //     const pointerPosition = stage.getPointerPosition();

    //     // Calculate distance from the click position to the center of the travel zone
    //     const distance = Math.sqrt(
    //         Math.pow(pointerPosition.x - travelZonePosition.x, 2) +
    //         Math.pow(pointerPosition.y - travelZonePosition.y, 2)
    //     );

    //     if (distance <= travelZoneRadius) {
    //         // Calculate the top-left of the nearest grid cell
    //         const gridX = Math.floor(pointerPosition.x / gridSpacing) * gridSpacing;
    //         const gridY = Math.floor(pointerPosition.y / gridSpacing) * gridSpacing;

    //         // Center the wizard in the grid cell
    //         setWizardPosition({ x: gridX + gridSpacing / 2 - wizardSize / 2, y: gridY + gridSpacing / 2 - wizardSize / 2 });
    //     }
    // };

    // const handleDragEnd = (e, index) => {
    //     // Get the position of the dragged icon
    //     const wizardX = e.target.x();
    //     const wizardY = e.target.y();

    //     // Your existing logic to calculate distance, etc., remains the same

    //     if (distance <= travelZoneRadius) {
    //         const centerGridX = Math.round(wizardX / gridSpacing) * gridSpacing;
    //         const centerGridY = Math.round(wizardY / gridSpacing) * gridSpacing;

    //         // Create a new wizards array with the position of the dragged wizard updated
    //         const newPlayers = internalPlayerIcons.map((player, idx) => {
    //             if (idx === index) {
    //                 return {
    //                     ...player,
    //                     x: centerGridX + gridSpacing / 2 - (playerData.figureIcon.width * player.scale) / 2,
    //                     y: centerGridY + gridSpacing / 2 - (playerData.figureIcon.height * player.scale) / 2
    //                 };
    //             }
    //             return player;
    //         });

    //         setInternalPlayerIcons(newPlayers);
    //     } else {
    //         // Revert to the original position if dragged outside the travel zone
    //         e.target.to({
    //             x: wizards[index].x,
    //             y: wizards[index].y,
    //             duration: 0.2 // Transition duration in seconds
    //         });
    //     }
    // };


    const animationClass = imageLoaded ? 'bubble-in' : '';

    const updatePlayerData = (playerName, newX, newY) => {
        console.log("updatePlayerData", playerName);
        setPlayers(prevPlayers => ({
            ...prevPlayers,
            [playerName]: { // Corrected this line
                ...prevPlayers[playerName],
                xPosition: newX,
                yPosition: newY,
            }
        }));
    };


    useEffect(() => {
        console.log("players username: ", players[userName]);
    }, [players[userName]]);

    return (

        <div className={className}>
            {imageLoaded && (
                <Stage
                    width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}
                    className={animationClass}
                >
                    <Layer>
                        <Image image={image} scaleX={scale} scaleY={scale}
                            className={animationClass} />
                        {drawGrid()}
                        {Object.entries(players).map(([playerName, playerData]) => (
                            <PlayerIcon key={playerName}
                                playerName={playerName}
                                playerData={playerData}
                                gridSpacing={gridSpacing}
                                userName={userName}
                                imageLoaded={imageLoaded}
                                updatePlayerData={(newX, newY) => updatePlayerData(playerName, newX, newY)} />
                        ))}
                    </Layer>
                </Stage>
            )}
        </div>

    );
};

export default BattleMap;
