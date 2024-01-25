// hooks/usePlayerIcons.jsx
import { useState, useEffect } from 'react';
import useImage from 'use-image';
import { Circle } from 'react-konva';

const usePlayerIcons = (players, gridSpacing) => {
    const [playerIcons, setPlayerIcons] = useState([]);

    useEffect(() => {
        if (players) {
            const icons = Object.entries(players).map(([playerName, playerData]) => {
                const [image, status] = useImage(playerData.figureIcon);

                if (status === 'loaded') {
                    const wizardScale = gridSpacing * 0.8 / image.width;
                    const wizardSize = image.width * wizardScale;
                    const gridX = playerData.xPosition;
                    const gridY = playerData.yPosition;
                    const pixelX = gridX * gridSpacing + gridSpacing / 2 - wizardSize / 2;
                    const pixelY = gridY * gridSpacing + gridSpacing / 2 - wizardSize / 2;

                    return {
                        x: pixelX,
                        y: pixelY,
                        scale: wizardScale,
                        icon: image
                    };
                }
                return null;
            }).filter(icon => icon !== null);

            setPlayerIcons(icons);
        }
    }, [players, gridSpacing]);

    return playerIcons;
};

export default usePlayerIcons;
