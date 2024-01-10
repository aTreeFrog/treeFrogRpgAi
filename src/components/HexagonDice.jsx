// HexagonDice.js
import { useState } from 'react';

const HexagonDice = ({ diceStates, setDiceStates }) => {
    const [isD20Spinning, setIsD20Spinning] = useState(false); // Initialize spinning state
    const [isD10Spinning, setIsD10Spinning] = useState(false);
    const [isD8Spinning, setIsD8Spinning] = useState(false);
    const [isD6Spinning, setIsD6Spinning] = useState(false);
    const [isD4Spinning, setIsD4Spinning] = useState(false);

    const rollDice = (maxNumber) => {

        if (maxNumber == 20) {
            setDiceStates(prevState => ({
                ...prevState,
                d20: {
                    ...prevState.d20,
                    displayedValue: null
                }
            }));
            setIsD20Spinning(true);
        } else if (maxNumber == 4) {
            setDiceStates(prevState => ({
                ...prevState,
                d4: {
                    ...prevState.d4,
                    displayedValue: null
                }
            }));
            setIsD4Spinning(true);
        } else if (maxNumber == 6) {
            setDiceStates(prevState => ({
                ...prevState,
                d6: {
                    ...prevState.d6,
                    displayedValue: null
                }
            }));
            setIsD6Spinning(true);
        } else if (maxNumber == 8) {
            setDiceStates(prevState => ({
                ...prevState,
                d8: {
                    ...prevState.d8,
                    displayedValue: null
                }
            }));
            setIsD8Spinning(true);
        } else if (maxNumber == 10) {
            setDiceStates(prevState => ({
                ...prevState,
                d10: {
                    ...prevState.d10,
                    displayedValue: null
                }
            }));
            setIsD10Spinning(true);
        }
        setTimeout(() => {
            const newValue = Math.floor(Math.random() * maxNumber) + 1; // Randomize dice value
            if (maxNumber == 20) {
                setDiceStates(prevState => ({
                    ...prevState,
                    d20: {
                        ...prevState.d20,
                        value: [...prevState.d20.value, newValue],
                        displayedValue: newValue,
                        rolls: prevState.d20.rolls + 1
                    }
                }));
                setIsD20Spinning(false);
            } else if (maxNumber == 4) {
                setDiceStates(prevState => ({
                    ...prevState,
                    d4: {
                        ...prevState.d4,
                        value: [...prevState.d4.value, newValue],
                        displayedValue: newValue,
                        rolls: prevState.d4.rolls + 1
                    }
                }));
                setIsD4Spinning(false);
            } else if (maxNumber == 6) {
                setDiceStates(prevState => ({
                    ...prevState,
                    d6: {
                        ...prevState.d6,
                        value: [...prevState.d6.value, newValue],
                        displayedValue: newValue,
                        rolls: prevState.d6.rolls + 1
                    }
                }));
                setIsD6Spinning(false);
            } else if (maxNumber == 8) {
                setDiceStates(prevState => ({
                    ...prevState,
                    d8: {
                        ...prevState.d8,
                        value: [...prevState.d8.value, newValue],
                        displayedValue: newValue,
                        rolls: prevState.d8.rolls + 1
                    }
                }));
                setIsD8Spinning(false);
            } else if (maxNumber == 10) {
                setDiceStates(prevState => ({
                    ...prevState,
                    d10: {
                        ...prevState.d10,
                        value: [...prevState.d10.value, newValue],
                        displayedValue: newValue,
                        rolls: prevState.d10.rolls + 1
                    }
                }));
                setIsD10Spinning(false);
            }
        }, 1600); // Duration to match CSS animation
    };

    return (

        <div className="inline-flex">
            <div class={`triangle-container`}>
                <div className={`triangle-glow triangle  ${isD4Spinning ? 'spinning' : ''} ${isD4Spinning ? 'no-glow' : ''} ${diceStates.d4.isGlowActive ? 'glow-active' : ''} ${diceStates.d4.isActive ? 'triangle-active' : 'triangle-inactive'}`}
                    onClick={() => {
                        if (!diceStates.d4.inhibit) {
                            rollDice(4);
                        }
                    }}
                >
                    <span class="triangle-text"> {diceStates.d4.displayedValue}</span>
                </div>
            </div>
            <div className={`hexagon-glow square ${isD6Spinning ? 'spinning no-glow' : ''} ${diceStates.d6.isGlowActive ? 'glow-active' : ''} ${diceStates.d6.isActive ? 'square-active' : 'square-inactive'}`}
                onClick={() => {
                    if (!diceStates.d6.inhibit) {
                        rollDice(6);
                    }
                }}
            >
                <span className="square-text">{diceStates.d6.displayedValue}</span>
            </div>
            <div
                className={`hexagon-glow hexagon ${isD20Spinning ? 'spinning' : ''} ${isD20Spinning ? 'no-glow' : ''} ${diceStates.d20.isGlowActive ? 'glow-active' : ''} ${diceStates.d20.isActive ? 'hexagon-active' : 'hexagon-inactive'}`}
                onClick={() => {
                    if (!diceStates.d20.inhibit) {
                        rollDice(20);
                    }
                }}
            >
                {diceStates.d20.displayedValue}
            </div>
            <div
                className={`hexagon-glow d8 ${isD8Spinning ? 'spinning' : ''} ${isD8Spinning ? 'no-glow' : ''} ${diceStates.d8.isGlowActive ? 'glow-active' : ''} ${diceStates.d8.isActive ? 'd8-active' : 'd8-inactive'}`}
                onClick={() => {
                    if (!diceStates.d8.inhibit) {
                        rollDice(8);
                    }
                }}
            >
                <span className="d8-text">{diceStates.d8.displayedValue}</span>
            </div>
            <div
                className={`hexagon-glow d10 ${isD10Spinning ? 'spinning' : ''} ${isD10Spinning ? 'no-glow' : ''} ${diceStates.d10.isGlowActive ? 'glow-active' : ''} ${diceStates.d10.isActive ? 'd10-active' : 'd10-inactive'}`}
                onClick={() => {
                    if (!diceStates.d10.inhibit) {
                        rollDice(10);
                    }
                }}
            >
                {diceStates.d10.displayedValue}
            </div>

        </div>

    );
};

export default HexagonDice;
