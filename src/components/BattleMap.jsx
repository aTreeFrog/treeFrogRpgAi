import React, { useState, useEffect } from 'react';
import { Stage, Layer, Image, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import PlayerIcon from '../components/PlayerIcon';

const BattleMap = ({ gridSpacing, className, players, setPlayers, userName, selectedRow, setSelectedRow }) => {
    const [image, status] = useImage(players[userName]?.battleMode.mapUrl);
    const [scale, setScale] = useState(1); // Default scale is 1
    //const [wizardIcImage] = useImage('/icons/wizard.svg'); //13 by 13 grid
    const [imageLoaded, setImageLoaded] = useState(false);
    const travelZoneRadius = 6.67;
    const [imageFigureUrl, setImageFigureUrl] = useState(null);
    let [userNameFigureImage] = useImage(imageFigureUrl);
    const [playerSize, setPlayerSize] = useState();
    const [pixelX, setPixelX] = useState();
    const [pixelY, setPixelY] = useState();
    const [clickable, setClickable] = useState(false);
    const [unavailCoord, setUnavailCoord] = useState([])
    const [lineLength, setLineLength] = useState();
    const [cursorPos, setCursorPos] = useState({ x: -50, y: -50 }); // Initial position off-screen
    const [attackRadius, setAttackRadius] = useState(0); // Initial attack radius


    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        setCursorPos(pointerPosition);
    };

    useEffect(() => {
        if (status === 'loaded') {
            setImageLoaded(true);
            console.log("image battlemap: ", image);
        }

    }, [status]);

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

    const handleMapClick = (e) => {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        const clickedGridX = Math.floor(pointerPosition.x / gridSpacing);
        const clickedGridY = Math.floor(pointerPosition.y / gridSpacing);

        // Calculate the pixel position of the center of the clicked grid cell
        const clickedPixelX = clickedGridX * gridSpacing + gridSpacing / 2 - playerSize / 2;
        const clickedPixelY = clickedGridY * gridSpacing + gridSpacing / 2 - playerSize / 2;

        console.log("Click event");

        const distance = Math.sqrt(
            Math.pow(clickedPixelX - pixelX, 2) +
            Math.pow(clickedPixelY - pixelY, 2)
        );

        console.log("pixelX", pixelX);

        console.log("distance", distance);

        //ensures coordinate moving to is not taken by another player
        const isUnavailable = unavailCoord.some(coord => {
            return coord[0] === clickedGridX && coord[1] === clickedGridY;
        });

        console.log("distanceMoved", players[userName]?.battleMode?.distanceMoved);
        console.log("radius stuff", (travelZoneRadius * (players[userName]?.distance - players[userName]?.battleMode?.distanceMoved)));

        if (!isUnavailable && (distance <= (travelZoneRadius * (players[userName]?.distance - players[userName]?.battleMode?.distanceMoved)))) {
            console.log("Clicked Grid Position:", clickedGridX, clickedGridY);
            console.log("Clicked Pixel Position:", clickedPixelX, clickedPixelY);

            // Update player data with the new grid position
            updatePlayerData(userName, clickedGridX, clickedGridY);
        }
    };


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
        setImageFigureUrl(players[userName].figureIcon);
        if (userNameFigureImage) {
            console.log("hi userNameFigureImage");
            const playerScale = gridSpacing * 0.8 / userNameFigureImage.width;
            setPlayerSize(userNameFigureImage.width * playerScale);
            const gridX = players[userName].xPosition;
            const gridY = players[userName].yPosition;
            setPixelX(gridX * gridSpacing + gridSpacing / 2 - playerSize / 2);
            setPixelY(gridY * gridSpacing + gridSpacing / 2 - playerSize / 2);
            console.log("battlemap pixelX", pixelX);
        }

        console.log("selectedRow", selectedRow);
        //selected row means the user selected an attack, so dont show travel radius circle
        if (players[userName]?.battleMode?.yourTurn && !selectedRow) {
            setClickable(true);
        } else {
            setClickable(false);
        }

        if (players[userName]?.battleMode?.yourTurn && selectedRow) {
            const attack = players[userName].attacks.find(attack => attack.name === selectedRow?.name);
            console.log("attack", attack);
            if (attack) {
                setLineLength(attack.distance);
                // Assuming xWidth and yWidth are diameters, calculating average radius
                const radius = (attack.xWidth + attack.yWidth) / 4; // Divided by 4 because we need the average radius
                setAttackRadius(radius);
            }
        }

    }, [imageFigureUrl, players[userName], selectedRow]);

    // set unavailable move to coordinates cause theres players there
    useEffect(() => {
        const newUnavailCoord = Object.entries(players).map(([playerName, playerData]) => {
            return [playerData.xPosition, playerData.yPosition];
        });

        console.log("newUnavailCoord", newUnavailCoord);

        setUnavailCoord(newUnavailCoord);

    }, [players]);




    return (

        <div className={className}>
            {imageLoaded && (
                <Stage
                    width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}
                    className={animationClass}
                    onClick={clickable ? handleMapClick : null}
                    onTap={clickable ? handleMapClick : null}
                    onMouseMove={handleMouseMove}
                >
                    <Layer>
                        <Image image={image} scaleX={scale} scaleY={scale}
                            className={animationClass} />
                        {drawGrid()}
                        {/* Cursor-following attack range circle */}
                        <Circle
                            x={cursorPos.x}
                            y={cursorPos.y}
                            radius={attackRadius}
                            fill="rgba(0, 0, 255, 0.3)" // Example styling
                            visible={!!attackRadius} // Only visible if attackRadius is set
                        />
                        {Object.entries(players).map(([playerName, playerData]) => (
                            <PlayerIcon key={playerName}
                                playerName={playerName}
                                playerData={playerData}
                                gridSpacing={gridSpacing}
                                userName={userName}
                                imageLoaded={imageLoaded}
                                updatePlayerData={(newX, newY) => updatePlayerData(playerName, newX, newY)}
                                travelZoneRadius={travelZoneRadius}
                                clickable={clickable}
                                unavailCoord={unavailCoord}
                                selectedRow={selectedRow}
                            />
                        ))}
                    </Layer>
                </Stage>
            )}
        </div>

    );
};

export default BattleMap;
