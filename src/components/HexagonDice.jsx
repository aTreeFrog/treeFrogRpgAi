// HexagonDice.js
import { useState } from 'react';

const HexagonDice = () => {
    const [d20Value, setD20Value] = useState(20); // Initialize dice value
    const [d4Value, setD4Value] = useState(4);
    const [isD20Spinning, setIsD20Spinning] = useState(false); // Initialize spinning state
    const [isD4Spinning, setIsD4Spinning] = useState(false);
    const [d20Active, setD20Active] = useState(true);
    const [d4Active, setD4Active] = useState(true);

    const rollDice = (maxNumber) => {

        if (maxNumber == 20) {
            setD20Value("");
            setIsD20Spinning(true);
        } else if (maxNumber == 4) {
            setD4Value("");
            setIsD4Spinning(true);
        }
        setTimeout(() => {
            const newValue = Math.floor(Math.random() * maxNumber) + 1; // Randomize dice value
            if (maxNumber == 20) {
                setD20Value(newValue); // Set new dice value
                setIsD20Spinning(false);
            } else if (maxNumber == 4) {
                setD4Value(newValue);
                setIsD4Spinning(false);
            }
        }, 1600); // Duration to match CSS animation
    };

    return (

        <div className="inline-flex">
            <div class={`triangle-container ${isD4Spinning ? 'spinning' : ''}`}>
                <div className={`hexagon-glow triangle  ${isD4Spinning ? 'no-glow' : ''} ${d4Active ? 'glow-active' : ''} ${d4Active ? 'triangle-active' : 'triangle-inactive'}`}
                    onClick={() => rollDice(4)}
                >
                    <span class="triangle-text"> {d4Value}</span>
                </div>
            </div>
            <div>
                <div
                    className={`hexagon-glow hexagon ${isD20Spinning ? 'spinning' : ''} ${isD20Spinning ? 'no-glow' : ''} ${d20Active ? 'glow-active' : ''} ${d20Active ? 'hexagon-active' : 'hexagon-inactive'}`}
                    onClick={() => rollDice(20)}
                >
                    {d20Value}
                </div>
            </div>
        </div>

    );
};

export default HexagonDice;
