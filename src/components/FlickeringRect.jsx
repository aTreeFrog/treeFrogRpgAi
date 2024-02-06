import React, { useRef, useEffect } from 'react';
import { Rect } from 'react-konva';

const FlickeringRect = ({ playerData, gridSpacing }) => {
    const rectRef = useRef(null);

    useEffect(() => {
        const node = rectRef.current;
        // Check if the node is available
        if (node) {
            const anim = new Konva.Animation((frame) => {
                // Calculate the new shadowBlur value
                // This creates a pulsing effect by using the sine function
                // You can adjust the speed and size of the glow by tweaking the multiplier and addition values
                if (frame) {
                    const scale = Math.sin(frame.time * 0.003) + 1; // Oscillates between 0 and 2
                    const shadowBlur = scale * 10; // Adjust base shadowBlur value here
                    node.shadowBlur(shadowBlur);
                }
            }, node.getLayer());

            anim.start();

            return () => anim.stop();
        }
    }, []);

    return (
        <Rect
            ref={rectRef}
            x={playerData?.pingXPosition * gridSpacing}
            y={playerData?.pingYPosition * gridSpacing}
            width={gridSpacing}
            height={gridSpacing}
            fill="purple"
            opacity="0.4"
            shadowColor="purple"
            shadowBlur={10} // Initial shadowBlur value
            shadowOpacity={2} // Adjust for desired glow intensity
            cornerRadius={4}
        />
    );
};

export default FlickeringRect;
