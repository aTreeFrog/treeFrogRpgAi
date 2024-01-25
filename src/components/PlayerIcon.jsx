// components/PlayerIcon.jsx
import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';

const PlayerIcon = ({ playerData, gridSpacing }) => {
    const [image] = useImage(playerData.figureIcon);

    if (!image) {
        return null; // Or some placeholder
    }

    const wizardScale = gridSpacing * 0.8 / image.width;
    const wizardSize = image.width * wizardScale;
    const gridX = playerData.xPosition;
    const gridY = playerData.yPosition;
    const pixelX = gridX * gridSpacing + gridSpacing / 2 - wizardSize / 2;
    const pixelY = gridY * gridSpacing + gridSpacing / 2 - wizardSize / 2;

    return (
        <Image
            image={image}
            x={pixelX}
            y={pixelY}
            scaleX={wizardScale}
            scaleY={wizardScale}
        />
    );
};

export default PlayerIcon;
