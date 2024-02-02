import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import PlayerIcon from '../components/PlayerIcon';
import BlurredLineEffect from '../components/BlurredLineEffect';

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
    const [cursorPos, setCursorPos] = useState({ x: -50, y: -50 }); // Initial position off-screen
    const [attackDistance, setAttackDistance] = useState(0); // Initial attack radius
    const [attackRadius, setAttackRadius] = useState(0);
    const [enableLines, setEnableLines] = useState(false);
    const [circleStop, setCircleStop] = useState(false);
    const [circleStopPosition, setCircleStopPosition] = useState({ x: 0, y: 0 });
    const attackSelection = useRef();



    const handleMouseMove = (e) => {

        // if (circleStop) {
        //     // If circleStop is true, prevent the circle from moving
        //     return;
        // }
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        setCursorPos(pointerPosition);
    };



    // Function to calculate the distance from a point to a line segment
    function pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq != 0) { // in case of 0 length line
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate the distance between the figure icon and the cursor position
    const distanceToCursor = Math.sqrt(Math.pow(cursorPos.x - (pixelX + playerSize / 2), 2) + Math.pow(cursorPos.y - (pixelY + playerSize / 2), 2));

    // Calculate the endpoint for the line within the allowed distance
    let endPoint = { x: cursorPos.x, y: cursorPos.y };
    if (distanceToCursor > attackDistance) {
        // Calculate the direction vector and normalize it
        const direction = { x: cursorPos.x - (pixelX + playerSize / 2), y: cursorPos.y - (pixelY + playerSize / 2) };
        const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
        const normalized = { x: direction.x / length, y: direction.y / length };

        // Scale the normalized direction by the attack distance to get the new endpoint
        endPoint = {
            x: (pixelX + playerSize / 2) + normalized.x * attackDistance,
            y: (pixelY + playerSize / 2) + normalized.y * attackDistance
        };
    }

    useEffect(() => {
        if (status === 'loaded') {
            setImageLoaded(true);
            console.log("image battlemap: ", image);
        }

    }, [status]);

    useEffect(() => {

        if (!selectedRow || attackSelection.current != selectedRow.name) {
            setCircleStop(false);

            console.log("update targeted");

            //ToDo: if no attack made, clear out any attacked enemies array for this player
            if (!players[userName]?.battleMode?.actionAttempted && players[userName]?.battleMode?.usersTargeted?.length > 0) {
                setPlayers(prevPlayers => ({
                    ...prevPlayers,
                    [userName]: { // userName is the name/key of the user you want to update
                        ...prevPlayers[userName],
                        battleMode: {
                            ...prevPlayers[userName].battleMode,
                            usersTargeted: [], // Set usersTargeted to new array
                        },
                    }
                }));
            }

        } else if (circleStop) {
            const coveredCells = getCoveredCells(circleStopPosition, attackRadius, gridSpacing);
            console.log("Covered Cells: ", coveredCells);

            const coveredPlayers = checkPlayerPositions(players, coveredCells);
            console.log("Covered players: ", coveredPlayers);

            let enemiesToMark = [];
            coveredPlayers.forEach(figure => {
                const attackData = players[userName].attacks.find(attack => attack.name === selectedRow?.name);
                console.log("attackData: ", attackData);

                if ((attackData.type == "spell" || attackData.type == "melee") && figure.type == "enemy") {
                    console.log("cell stuff: ", figure);
                    enemiesToMark.push(figure.name);

                }

                if (enemiesToMark.length > 0) {
                    setPlayers(prevPlayers => ({
                        ...prevPlayers,
                        [userName]: { // userName is the name/key of the user you want to update
                            ...prevPlayers[userName],
                            battleMode: {
                                ...prevPlayers[userName].battleMode,
                                usersTargeted: enemiesToMark, // Set usersTargeted to enemiesToMark directly
                            },
                        }
                    }));
                } else {
                    setCircleStop(false); //no players to mark so dont' stop circle position
                }

                //ToDo: handle heal spells here 

            });



        }

        attackSelection.current = selectedRow?.name;

    }, [selectedRow, circleStop, circleStopPosition]);

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

        // Calculate the nearest grid cell center
        const clickedGridX = Math.floor(pointerPosition.x / gridSpacing);
        const clickedGridY = Math.floor(pointerPosition.y / gridSpacing);

        //set attack bubble if attack/spell selected
        if (selectedRow && !circleStop) {

            // Calculate the pixel position of the center of the clicked grid cell
            const clickedPixelX = clickedGridX * gridSpacing + gridSpacing / 2;
            const clickedPixelY = clickedGridY * gridSpacing + gridSpacing / 2;

            // Check if the circle should stop based on the line logic
            const lineStart = { x: pixelX + playerSize / 2, y: pixelY + playerSize / 2 };
            const lineEnd = endPoint; // Ensure this is correctly calculated based on previous logic
            const circleCenter = { x: clickedPixelX, y: clickedPixelY };
            const circleRadius = attackRadius; // Ensure this is set to your circle's radius

            // Calculate distance from the line segment to the new circle's center
            // (Use the pointToLineDistance function provided in the previous message)
            const distance = pointToLineDistance(pointerPosition.x, pointerPosition.y, lineStart.x, lineStart.y, lineEnd.x, lineEnd.y);

            // Only update if within white line segment and not intersecting with the red part or beyond
            if (distance <= circleRadius) {
                setCircleStop(true);
                setCircleStopPosition(circleCenter);
                console.log("clickedPixelX", clickedPixelX);
                console.log("clickedPixelY", clickedPixelY);
            } else {
                // Optionally, allow resetting or adjusting behavior here
                setCircleStop(false);
            }

            // move icon to new clicked position. 
        } else if (!circleStop) {

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


        if (players[userName]?.battleMode?.yourTurn) {

            //selected row means the user selected an attack, so dont show travel radius circle
            // but enable lines
            if (!selectedRow) {
                setClickable(true);
                setEnableLines(false);
            } else {
                setClickable(false);
                //if the attack circle is selected at a spot, dont keep showing the lines
                if (!circleStop) {
                    setEnableLines(true);
                } else {
                    setEnableLines(false);
                }
            }

            // not your turn so no lines or travel circle
        } else {
            setClickable(false);
            setEnableLines(false);
        }

        if (players[userName]?.battleMode?.yourTurn && selectedRow) {
            const attack = players[userName].attacks.find(attack => attack.name === selectedRow?.name);
            console.log("attack", attack);
            if (attack) {
                setAttackDistance(attack.distance * travelZoneRadius + 3); // +3 for margin
                // Assuming xWidth and yWidth are diameters, calculating average radius
                const radius = (attack.xWidth + attack.yWidth) / 4; // Divided by 4 because we need the average radius
                setAttackRadius(radius * travelZoneRadius);
            }
        } else {
            setAttackRadius(0);
        }

    }, [imageFigureUrl, players, selectedRow, circleStop]);

    // set unavailable move to coordinates cause theres players there
    useEffect(() => {
        const newUnavailCoord = Object.entries(players).map(([playerName, playerData]) => {
            return [playerData.xPosition, playerData.yPosition];
        });

        console.log("newUnavailCoord", newUnavailCoord);

        setUnavailCoord(newUnavailCoord);

    }, [players]);


    //figure out which cells contain the attack circle if its clicked
    const getCoveredCells = (circleCenter, radius, gridSpacing) => {
        // Calculate the bounds of the circle in terms of grid coordinates
        const left = circleCenter.x - radius;
        const right = circleCenter.x + radius;
        const top = circleCenter.y - radius;
        const bottom = circleCenter.y + radius;

        // Convert these bounds to grid indices
        const leftIndex = Math.floor(left / gridSpacing);
        const rightIndex = Math.floor(right / gridSpacing);
        const topIndex = Math.floor(top / gridSpacing);
        const bottomIndex = Math.floor(bottom / gridSpacing);

        const coveredCells = [];

        // Check each cell within the bounds to see if it's at least half covered
        for (let i = leftIndex; i <= rightIndex; i++) {
            for (let j = topIndex; j <= bottomIndex; j++) {
                // Calculate the center of the current cell
                const cellCenter = {
                    x: (i * gridSpacing) + (gridSpacing / 2),
                    y: (j * gridSpacing) + (gridSpacing / 2),
                };

                // Calculate distance from the cell center to the circle center
                const distance = Math.sqrt(Math.pow(cellCenter.x - circleCenter.x, 2) + Math.pow(cellCenter.y - circleCenter.y, 2));

                // If the distance is less than or equal to radius - gridSpacing/2, the cell is at least half covered
                if (distance <= radius - (gridSpacing / 2)) {
                    coveredCells.push({ x: i, y: j });
                }
            }
        }

        return coveredCells;
    };

    // Function to check if a player's position exists in the coordinates array
    function checkPlayerPositions(players, coordinates) {
        const results = [];

        Object.entries(players).forEach(([playerName, player]) => {
            const { xPosition, yPosition } = player;
            const positionExists = coordinates.some(coord => coord.x === xPosition && coord.y === yPosition);

            if (positionExists) {
                results.push({
                    name: playerName,
                    position: { x: xPosition, y: yPosition },
                    type: player.type,
                });
            }
        });

        return results;
    }

    return (

        <div className={className}>
            {imageLoaded && (
                <Stage
                    width={scale * (image ? image.width : 0)} height={scale * (image ? image.height : 0)}
                    className={animationClass}
                    onClick={handleMapClick}
                    onTap={handleMapClick}
                    onMouseMove={handleMouseMove}
                >
                    <Layer>
                        <Image image={image} scaleX={scale} scaleY={scale}
                            className={animationClass} />
                        {drawGrid()}
                        {enableLines && (
                            <>
                                <Line
                                    points={[pixelX + playerSize / 2, pixelY + playerSize / 2, endPoint.x, endPoint.y]}
                                    stroke="white"
                                    strokeWidth={2}
                                    lineCap="round"
                                    lineJoin="round"
                                    dash={[10, 5]} // This makes the line dashed
                                />
                                {/* Line beyond attack distance, if any */}
                                {distanceToCursor > attackDistance && (
                                    <Line
                                        points={[endPoint.x, endPoint.y, cursorPos.x, cursorPos.y]}
                                        stroke="red"
                                        strokeWidth={2}
                                        lineCap="round"
                                        lineJoin="round"
                                        dash={[10, 5]} // This makes the line dashed
                                    />
                                )}
                            </>
                        )}
                        {/* Cursor-following attack range circle */}
                        <Circle
                            x={circleStop ? circleStopPosition.x : cursorPos.x}
                            y={circleStop ? circleStopPosition.y : cursorPos.y}
                            radius={attackRadius}
                            fill="rgba(235, 48, 67, 0.5)" // Example styling
                            visible={!!attackRadius && !circleStop} // Only visible if attackRadius is set
                        />
                        {Object.entries(players).map(([playerName, playerData]) => (
                            <>
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
                                {playerData?.battleMode?.targeted && (
                                    <BlurredLineEffect
                                        playerData={playerData}
                                        gridSpacing={gridSpacing}
                                    />
                                )}
                            </>
                        ))}
                    </Layer>
                </Stage>
            )}
        </div>

    );
};

export default BattleMap;
