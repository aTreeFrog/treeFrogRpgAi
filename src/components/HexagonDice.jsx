// HexagonDice.js
import { useState } from 'react';

const HexagonDice = () => {
    const [value, setValue] = useState(1); // Initialize dice value
    const [isSpinning, setIsSpinning] = useState(false); // Initialize spinning state
    const [d20Active, setD20Active] = useState(true);
    const [d4Active, setD4Active] = useState(false);

    const rollDice = () => {
        setIsSpinning(true); // Begin spinning
        setValue("");
        setTimeout(() => {
            const newValue = Math.floor(Math.random() * 20) + 1; // Randomize dice value
            setValue(newValue); // Set new dice value
            setIsSpinning(false); // Stop spinning
        }, 1600); // Duration to match CSS animation
    };

    return (

        <div className={`hexagon-glow ${isSpinning ? 'no-glow' : ''}`}>
            <div className={`triangle ${isSpinning ? 'spinning' : ''} ${d4Active ? 'triangle-active' : 'triangle-inactive'}`}
            ></div>
            <div
                className={`hexagon ${isSpinning ? 'spinning' : ''} ${d20Active ? 'hexagon-active' : 'hexagon-inactive'}`}

                onClick={rollDice}
            >
                {value}
            </div>
        </div>

    );
};

export default HexagonDice;
