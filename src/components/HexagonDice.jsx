// HexagonDice.js
import { useState } from 'react';

const HexagonDice = () => {
    const [d20Value, setD20Value] = useState(20); // Initialize dice value
    const [d10Value, setD10Value] = useState(10);
    const [d8Value, setD8Value] = useState(8);
    const [d6Value, setD6Value] = useState(6);
    const [d4Value, setD4Value] = useState(4);
    const [isD20Spinning, setIsD20Spinning] = useState(false); // Initialize spinning state
    const [isD10Spinning, setIsD10Spinning] = useState(false);
    const [isD8Spinning, setIsD8Spinning] = useState(false);
    const [isD6Spinning, setIsD6Spinning] = useState(false);
    const [isD4Spinning, setIsD4Spinning] = useState(false);
    const [d20Active, setD20Active] = useState(true);
    const [d10Active, setD10Active] = useState(true);
    const [d8Active, setD8Active] = useState(true);
    const [d6Active, setD6Active] = useState(true);
    const [d4Active, setD4Active] = useState(true);
    const [d20GlowActive, setD20GlowActive] = useState(true);
    const [d10GlowActive, setD10GlowActive] = useState(false);
    const [d8GlowActive, setD8GlowActive] = useState(false);
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
        } else if (maxNumber == 8) {
            setD8Value("");
            setIsD8Spinning(true);
        } else if (maxNumber == 10) {
            setD10Value("");
            setIsD10Spinning(true);
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
            } else if (maxNumber == 8) {
                setD8Value(newValue);
                setIsD8Spinning(false);
            } else if (maxNumber == 10) {
                setD10Value(newValue);
                setIsD10Spinning(false);
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
            <div
                className={`hexagon-glow d8 ${isD8Spinning ? 'spinning' : ''} ${isD8Spinning ? 'no-glow' : ''} ${d8GlowActive ? 'glow-active' : ''} ${d8Active ? 'd8-active' : 'd8-inactive'}`}
                onClick={() => rollDice(8)}
            >
                <span className="d8-text">{d8Value}</span>
            </div>
            <div
                className={`hexagon-glow d10 ${isD10Spinning ? 'spinning' : ''} ${isD10Spinning ? 'no-glow' : ''} ${d10GlowActive ? 'glow-active' : ''} ${d10Active ? 'd10-active' : 'd10-inactive'}`}
                onClick={() => rollDice(10)}
            >
                {d10Value}
            </div>

        </div>

    );
};

export default HexagonDice;
