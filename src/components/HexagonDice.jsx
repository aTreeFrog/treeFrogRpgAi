// HexagonDice.js
import { useState } from 'react';

const HexagonDice = () => {
    const [d20Value, setD20Value] = useState(20); // Initialize dice value
    const [d6Value, setD6Value] = useState(4);
    const [d4Value, setD4Value] = useState(4);
    const [isD20Spinning, setIsD20Spinning] = useState(false); // Initialize spinning state
    const [isD6Spinning, setIsD6Spinning] = useState(false);
    const [isD4Spinning, setIsD4Spinning] = useState(false);
    const [d20Active, setD20Active] = useState(false);
    const [d6Active, setD6Active] = useState(false);
    const [d4Active, setD4Active] = useState(false);
    const [d20GlowActive, setD20GlowActive] = useState(false);
    const [d6GlowActive, setD6GlowActive] = useState(false);
    const [d4GlowActive, setD4GlowActive] = useState(false);

    const rollDice = (maxNumber) => {

        if (maxNumber == 20) {
            setD20Value("");
            setIsD20Spinning(true);
        } else if (maxNumber == 4) {
            setD4Value("");
            setIsD4Spinning(true);
        } else if (maxNumber == 6) {
            setD6Value("");
            setIsD6Spinning(true);
        }
        setTimeout(() => {
            const newValue = Math.floor(Math.random() * maxNumber) + 1; // Randomize dice value
            if (maxNumber == 20) {
                setD20Value(newValue); // Set new dice value
                setIsD20Spinning(false);
            } else if (maxNumber == 4) {
                setD4Value(newValue);
                setIsD4Spinning(false);
            } else if (maxNumber == 6) {
                setD6Value(newValue);
                setIsD6Spinning(false);
            }
        }, 1600); // Duration to match CSS animation
    };

    return (

        <div className="inline-flex">
            <div class={`triangle-container`}>
                <div className={`triangle-glow triangle  ${isD4Spinning ? 'spinning' : ''} ${isD4Spinning ? 'no-glow' : ''} ${d4GlowActive ? 'glow-active' : ''} ${d4Active ? 'triangle-active' : 'triangle-inactive'}`}
                    onClick={() => rollDice(4)}
                >
                    <span class="triangle-text"> {d4Value}</span>
                </div>
            </div>
            <div className={`hexagon-glow square ${isD6Spinning ? 'spinning no-glow' : ''} ${d6GlowActive ? 'glow-active' : ''} ${d6Active ? 'square-active' : 'square-inactive'}`}
                onClick={() => rollDice(6)}
            >
                <span className="square-text">{d6Value}</span>
            </div>

            <div
                className={`hexagon-glow hexagon ${isD20Spinning ? 'spinning' : ''} ${isD20Spinning ? 'no-glow' : ''} ${d20GlowActive ? 'glow-active' : ''} ${d20Active ? 'hexagon-active' : 'hexagon-inactive'}`}
                onClick={() => rollDice(20)}
            >
                {d20Value}
            </div>

        </div>

    );
};

export default HexagonDice;
