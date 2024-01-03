// HexagonDice.js
import { useState } from 'react';

const HexagonDice = () => {
    const [value, setValue] = useState(1); // Initialize dice value
    const [isSpinning, setIsSpinning] = useState(false); // Initialize spinning state

    const rollDice = () => {
        setIsSpinning(true); // Begin spinning
        setValue("");
        setTimeout(() => {
            const newValue = Math.floor(Math.random() * 20) + 1; // Randomize dice value
            setValue(newValue); // Set new dice value
            setIsSpinning(false); // Stop spinning
        }, 2600); // Duration to match CSS animation
    };

    return (
        <div className="hexagon-glow">
            <div
                className={`hexagon ${isSpinning ? 'spinning' : ''}`}
                onClick={rollDice}
            >
                {value}
            </div>
        </div>
    );
};

export default HexagonDice;
