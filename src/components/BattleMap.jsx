import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Line, Circle, Rect, Group } from 'react-konva';
import useImage from 'use-image';
import PlayerIcon from '../components/PlayerIcon';
import BlurredLineEffect from '../components/BlurredLineEffect';
import FlickeringRect from '../components/FlickeringRect'
import DriftingTextEffect from '../components/DriftingTextEffect';
import { cloneDeep } from 'lodash';

const BattleMap = ({ gridSpacing, className, players, setPlayers, userName, selectedRow, setSelectedRow, showPlayerName, setShowPlayerName, pingReady, setPingReady }) => {
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
    const [pingStop, setPingStop] = useState(false);
    const [showEnemyResult, setShowEnemyResult] = useState({});
    const prevPlayersBattleData = useRef(players);
    const showHealthChange = useRef({});
    const spells = useRef([]);
    const layerRef = useRef(null);

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
        }

    }, [status]);

    useEffect(() => {

        //if attack selected, ping already set, leave it there 
        //but make sure no ping button is floating around.
        if (selectedRow) {
            setPingStop(true);
            if (!players[userName].pingXPosition) {
                setPingReady(false);
            }
        }

        if (!selectedRow || attackSelection.current != selectedRow.name) {
            setCircleStop(false);

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

        }

        attackSelection.current = selectedRow?.name;

    }, [selectedRow]);

    useEffect(() => {

        if (pingReady) {
            setSelectedRow(false);
            setPingStop(false);
        } else {
            //reset ping location if turned off
            setPlayers(prevPlayers => ({
                ...prevPlayers,
                [userName]: { // userName is the name/key of the user you want to update
                    ...prevPlayers[userName],
                    pingXPosition: null,
                    pingYPosition: null,
                }
            }));
        }

    }, [pingReady]);


    useEffect(() => {

        if (circleStop && players[userName].battleMode.yourTurn) {
            const coveredCells = getCoveredCells(circleStopPosition, attackRadius, gridSpacing);
            console.log("Covered Cells: ", coveredCells);

            const coveredPlayers = checkPlayerPositions(players, coveredCells);
            console.log("Covered players: ", coveredPlayers);

            let enemiesToMark = [];
            let toMyLeft = 0;
            let scaleXValue = 1;
            coveredPlayers.forEach(figure => {
                const attackData = players[userName].attacks.find(attack => attack.name === selectedRow?.name);
                console.log("attackData: ", attackData);

                if ((attackData.type == "spell" || attackData.type == "melee") && figure.type == "enemy") {
                    console.log("cell stuff: ", figure);
                    enemiesToMark.push(figure.name);

                    if (figure.position.x < players[userName].xPosition) {
                        toMyLeft++;
                    }

                }

                //ToDo: handle heal spells here 

            });

            if (enemiesToMark.length > 0) {

                //if enemies are to the left, scale the icon to look left
                if (toMyLeft > 0 && toMyLeft == enemiesToMark.length) {
                    scaleXValue = -1;
                }

                setPlayers(prevPlayers => ({
                    ...prevPlayers,
                    [userName]: { // userName is the name/key of the user you want to update
                        ...prevPlayers[userName],
                        xScale: scaleXValue,
                        battleMode: {
                            ...prevPlayers[userName].battleMode,
                            usersTargeted: enemiesToMark, // Set usersTargeted to enemiesToMark directly
                        },
                    }
                }));
            } else {
                setCircleStop(false); //no players to mark so dont' stop circle position
            }

        }

    }, [circleStop]);

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

        if (!players[userName].battleMode.yourTurn && (clickedGridX == players[userName].pingXPosition) && (clickedGridY == players[userName].pingYPosition)) {
            console.log("himadeithere");
            setPingStop(false);
            setPingReady(false);
            setPlayers(prevPlayers => ({
                ...prevPlayers,
                [userName]: { // userName is the name/key of the user you want to update
                    ...prevPlayers[userName],
                    pingXPosition: null,
                    pingYPosition: null,
                }
            }));
        }

        //set attack bubble if attack/spell selected
        if (selectedRow && !circleStop && !players[userName]?.battleMode?.actionAttempted && players[userName].battleMode.yourTurn) {

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
            }

            // move icon to new clicked position. 
        } else if (!selectedRow && !pingReady && players[userName]?.battleMode?.yourTurn) {

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

        } else if (pingReady && !pingStop) {
            setPingStop(true);
            setPlayers(prevPlayers => ({
                ...prevPlayers,
                [userName]: { // userName is the name/key of the user you want to update
                    ...prevPlayers[userName],
                    pingXPosition: clickedGridX,
                    pingYPosition: clickedGridY,
                }
            }));
        }

    };


    const animationClass = imageLoaded ? 'bubble-in' : '';

    const updatePlayerData = (playerName, newX, newY) => {
        console.log("updatePlayerData", playerName);
        setPlayers(prevPlayers => ({
            ...prevPlayers,
            [playerName]: { // Corrected this line
                ...prevPlayers[playerName],
                xScale: 1,
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
                if (!circleStop && !players[userName]?.battleMode?.actionAttempted) {
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

        if (players[userName]?.battleMode?.yourTurn && selectedRow && !players[userName]?.battleMode?.actionAttempted) {
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

        const newSpells = [];
        Object.entries(players).forEach(([playerName, playerData]) => {

            if (!prevPlayersBattleData.current.hasOwnProperty(playerName)) {
                return;
            }

            // set attack succeed or failed above players after attack roll made 
            if (playerData?.battleMode?.enemyAttackAttempt == "SUCCESS" && prevPlayersBattleData.current[playerName]?.battleMode?.enemyAttackAttempt == "INIT") {
                setShowEnemyResult(prevState => ({
                    ...prevState,
                    [playerName]: "SUCCESS"
                }));
                setTimeout(() => {
                    setShowEnemyResult(prevState => ({
                        ...prevState,
                        [playerName]: "INIT"
                    }));
                }, 5000);
            } else if (playerData?.battleMode?.enemyAttackAttempt == "FAIL" && prevPlayersBattleData.current[playerName]?.battleMode?.enemyAttackAttempt == "INIT") {
                setShowEnemyResult(prevState => ({
                    ...prevState,
                    [playerName]: "FAIL"
                }));
                setTimeout(() => {
                    setShowEnemyResult(prevState => ({
                        ...prevState,
                        [playerName]: "INIT"
                    }));
                }, 5000);
            }

            // check if player health changed. 
            if (playerData.currentHealth < prevPlayersBattleData.current[playerName]?.currentHealth) {

                console.log("playerData.currentHealth ", playerData.currentHealth);
                console.log("prevPlayersBattleData.current[playerName]?.currentHealth ", prevPlayersBattleData.current[playerName]?.currentHealth);
                console.log("subtraction ", prevPlayersBattleData.current[playerName]?.currentHealth - playerData.currentHealth);
                showHealthChange.current[playerName] = {
                    type: "DECREASE",
                    amount: prevPlayersBattleData.current[playerName]?.currentHealth - playerData.currentHealth,
                }
                setTimeout(() => {
                    showHealthChange.current[playerName] = {
                        type: "",
                        amount: null,
                    }
                }, 5000);

            } else if (playerData.currentHealth > prevPlayersBattleData.current[playerName]?.currentHealth) {

                showHealthChange.current[playerName] = {
                    type: "INCREASE",
                    amount: playerData.currentHealth - prevPlayersBattleData.current[playerName]?.currentHealth,
                }
                setTimeout(() => {
                    showHealthChange.current[playerName] = {
                        type: "",
                        amount: null,
                    }
                }, 5000);

            }

            // if player just attacked, set attacking effects
            if (playerData.battleMode.damageDelt > 0 && (prevPlayersBattleData.current[playerName]?.battleMode.damageDelt < 1 || !prevPlayersBattleData.current[playerName]?.battleMode.damageDelt)) {
                console.log("beginning of if");
                console.log("prevPlayersBattleData.current[playerName]?.damageDelt ", prevPlayersBattleData.current[playerName]);
                playerData.battleMode.usersTargeted.forEach((targetName) => {
                    const target = players[targetName];
                    if (target) {
                        console.log("target", target);
                        const spell = {
                            from: {
                                x: playerData.xPosition * gridSpacing + gridSpacing / 2,
                                y: playerData.yPosition * gridSpacing + gridSpacing / 2,
                            },
                            to: {
                                x: target.xPosition * gridSpacing + gridSpacing / 2,
                                y: target.yPosition * gridSpacing + gridSpacing / 2,
                            },
                            player: playerName,
                            target: targetName,
                            progress: 0,
                        };
                        console.log("targetspellfrom", spell.from);
                        newSpells.push(spell);
                    }
                });

            }

        });

        if (newSpells.length > 0) {
            spells.current = newSpells;
            newSpells.forEach(animateSpell);
            setTimeout(() => {
                spells.current = [];
            }, 5000);

        }

        prevPlayersBattleData.current = cloneDeep(players);

    }, [players]);

    const generateLightningPoints = (from, to) => {
        // This function should generate points that zigzag between 'from' and 'to'
        // For simplicity, this is a placeholder for the actual implementation
        return [from.x, from.y, (from.x + to.x) / 2, from.y - 10, to.x, to.y];
    };

    //animation for attack spells
    const animateSpell = (spell) => {
        let line = new Konva.Line({
            points: generateLightningPoints(spell.from, spell.to),
            stroke: 'cyan',
            strokeWidth: 3,
            lineCap: 'round',
            lineJoin: 'round',
            opacity: 0.8,
        });

        layerRef.current.add(line);

        const anim = new Konva.Animation((frame) => {
            if (!frame) return;
            const progress = Math.min(frame.time / 1000 / 0.5, 1); // Speed up the animation
            if (progress < 1) {
                line.points(generateLightningPoints(spell.from, spell.to));
            } else {
                anim.stop();
                line.destroy(); // Remove the line after animation
                spell.explosion = true; // Prepare for explosion effect

                // Trigger explosion effect here
                createExplosion(spell.to, layerRef.current);
            }
        }, layerRef.current);

        anim.start();
    };

    const createExplosion = (target, layer) => {
        // Main explosion effect
        const explosionCircle = new Konva.Circle({
            x: target.x,
            y: target.y,
            radius: 10,
            fill: 'purple',
            opacity: 0.8,
        });

        layer.add(explosionCircle);

        new Konva.Tween({
            node: explosionCircle,
            duration: 3.5,
            radius: 40, // Final size of the main explosion effect
            opacity: 0,
            easing: Konva.Easings.EaseOut,
            onFinish: () => explosionCircle.destroy(),
        }).play();

        // Particles effect
        for (let i = 0; i < 35; i++) { // Number of particles
            const particle = new Konva.Circle({
                x: target.x,
                y: target.y,
                radius: Math.random() * 2 + 1, // Random size
                fill: 'blue',
                opacity: 0.8,
            });

            layer.add(particle);

            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50; // Random distance from center

            new Konva.Tween({
                node: particle,
                duration: 0.5 + Math.random() * 0.5, // Random duration for more dynamic effect
                x: target.x + Math.cos(angle) * distance,
                y: target.y + Math.sin(angle) * distance,
                opacity: 0,
                easing: Konva.Easings.EaseOut,
                onFinish: () => particle.destroy(),
            }).play();
        }

        layer.batchDraw();
    };




    const getCoveredCells = (circleCenter, radius, gridSpacing) => {
        const coveredCells = [];

        // Calculate the effective bounds of the circle to include cells that are substantially covered
        const effectiveBounds = {
            left: circleCenter.x - radius,
            right: circleCenter.x + radius,
            top: circleCenter.y - radius,
            bottom: circleCenter.y + radius,
        };

        // Determine grid indices for the bounding box
        const leftIndex = Math.floor(effectiveBounds.left / gridSpacing);
        const rightIndex = Math.ceil(effectiveBounds.right / gridSpacing) - 1; // Adjust to exclude barely touched cells on the right and bottom
        const topIndex = Math.floor(effectiveBounds.top / gridSpacing);
        const bottomIndex = Math.ceil(effectiveBounds.bottom / gridSpacing) - 1; // Adjust as above

        for (let i = leftIndex; i <= rightIndex; i++) {
            for (let j = topIndex; j <= bottomIndex; j++) {
                // Determine if the circle's area substantively overlaps with the cell
                // Check if the distance from the circle's center to the closest point of the cell is less than the radius
                const closestPoint = {
                    x: Math.max(i * gridSpacing, Math.min(circleCenter.x, (i + 1) * gridSpacing)),
                    y: Math.max(j * gridSpacing, Math.min(circleCenter.y, (j + 1) * gridSpacing)),
                };
                const distanceToClosestPoint = Math.sqrt(
                    (closestPoint.x - circleCenter.x) ** 2 +
                    (closestPoint.y - circleCenter.y) ** 2
                );

                if (distanceToClosestPoint < radius) {
                    // Additionally, check if the cell's center is within the circle to ensure substantial overlap
                    const cellCenter = {
                        x: i * gridSpacing + gridSpacing / 2,
                        y: j * gridSpacing + gridSpacing / 2,
                    };
                    const distanceToCellCenter = Math.sqrt(
                        (cellCenter.x - circleCenter.x) ** 2 +
                        (cellCenter.y - circleCenter.y) ** 2
                    );

                    if (distanceToCellCenter <= radius) {
                        coveredCells.push({ x: i, y: j });
                    }
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

        <div className={className} style={{
            cursor: 'pointer'
        }}>
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
                        <Circle
                            x={players[userName].xPosition * gridSpacing + gridSpacing / 2}
                            y={players[userName].yPosition * gridSpacing + gridSpacing / 2}
                            radius={travelZoneRadius * (players[userName]?.distance - players[userName]?.battleMode?.distanceMoved)} // Larger radius for the travel zone
                            fill="rgba(255, 255, 0, 0.3)" // Semi-transparent yellow
                            className={animationClass}
                            visible={clickable}
                        />
                        <Circle
                            x={pingStop ? -50 : cursorPos.x}
                            y={pingStop ? -50 : cursorPos.y}
                            radius={travelZoneRadius * 3.5}
                            fill="purple"
                            opacity={0.6}
                            visible={
                                !!pingReady &&
                                !pingStop &&
                                cursorPos.x >= 0 && // Ensure cursor is within the stage bounds
                                cursorPos.y >= 0 && // Ensure cursor is within the stage bounds
                                cursorPos.x < (0.57 * (image ? image.width : 0)) && // Cursor within scaled image width
                                cursorPos.y < (0.57 * (image ? image.height : 0)) // Cursor within scaled image height
                            }
                        />

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
                            <React.Fragment key={playerName}>
                                <>
                                    {playerData?.pingXPosition && (
                                        <FlickeringRect playerData={playerData} gridSpacing={gridSpacing}
                                        />
                                    )}
                                    <Group ref={node => node && node.moveToTop()}>
                                        <PlayerIcon
                                            key={playerName}
                                            playerName={playerName}
                                            playerData={playerData}
                                            gridSpacing={gridSpacing}
                                            userName={userName}
                                            imageLoaded={imageLoaded}
                                            updatePlayerData={(newX, newY) => updatePlayerData(playerName, newX, newY)}
                                            travelZoneRadius={travelZoneRadius}
                                            clickable={clickable}
                                            unavailCoord={unavailCoord}
                                            showPlayerName={showPlayerName}
                                            setShowPlayerName={setShowPlayerName}
                                            showEnemyResult={showEnemyResult}
                                            selectedRow={selectedRow}
                                            circleStop={circleStop}
                                        />
                                        {playerData?.battleMode?.enemyAttackAttempt === "SUCCESS" && (
                                            <BlurredLineEffect
                                                playerData={playerData}
                                                gridSpacing={gridSpacing}
                                            />
                                        )}
                                        {playerData?.battleMode?.enemyAttackAttempt && playerData?.battleMode?.enemyAttackAttempt !== "INIT" && (
                                            <DriftingTextEffect
                                                playerData={playerData}
                                                gridSpacing={gridSpacing}
                                                showHealthChange={showHealthChange}
                                            />
                                        )}
                                    </Group>
                                </>
                            </React.Fragment>
                        ))}
                    </Layer>
                    <Layer ref={layerRef}>
                    </Layer>
                </Stage>
            )}
        </div>

    );
};

export default BattleMap;
