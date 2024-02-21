// HexagonDice.js
import { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

const HexagonDice = ({ diceStates, setDiceStates, floatingValue, setFloatingValue, isD20Spinning, setIsD20Spinning }) => {
  const [isD10Spinning, setIsD10Spinning] = useState(false);
  const [isD8Spinning, setIsD8Spinning] = useState(false);
  const [isD6Spinning, setIsD6Spinning] = useState(false);
  const [isD4Spinning, setIsD4Spinning] = useState(false);
  const [totalValue, setTotalValue] = useState(null);
  const diceSpun = useRef(false);

  //create a sum total for the dice rolls only if its not a d20 roll and theres rolls needed
  useEffect(() => {
    console.log("diceStates sum: ", diceStates);
    let sum = 0;
    let shouldUpdateTotalValue = false; // Flag to determine if totalValue should be updated

    Object.entries(diceStates).forEach(([key, dice]) => {
      if (key !== "d20" && dice.rollsNeeded > 0) {
        shouldUpdateTotalValue = true;
        // Step 2: Ignore d20
        const valuesToSum = dice.value.slice(0, dice.rollsNeeded); // Take up to rollsNeeded values
        sum += valuesToSum.reduce((acc, curr) => acc + (curr || 0), 0); // Sum them up, defaulting to 0 if undefined
      }
    });

    if (shouldUpdateTotalValue) {
      console.log("dice sum ", sum);
      setTotalValue(sum);
    } else if (totalValue > 0) {
      setTimeout(() => {
        setTotalValue(null);
      }, 6000);
    }
  }, [diceStates]);

  const rollDice = (maxNumber) => {
    if (maxNumber == 20) {
      setDiceStates((prevState) => ({
        ...prevState,
        d20: {
          ...prevState.d20,
          displayedValue: null,
        },
      }));
      setIsD20Spinning(true);
    } else if (maxNumber == 4) {
      setDiceStates((prevState) => ({
        ...prevState,
        d4: {
          ...prevState.d4,
          displayedValue: null,
        },
      }));
      setIsD4Spinning(true);
    } else if (maxNumber == 6) {
      setDiceStates((prevState) => ({
        ...prevState,
        d6: {
          ...prevState.d6,
          displayedValue: null,
        },
      }));
      setIsD6Spinning(true);
    } else if (maxNumber == 8) {
      setDiceStates((prevState) => ({
        ...prevState,
        d8: {
          ...prevState.d8,
          displayedValue: null,
        },
      }));
      setIsD8Spinning(true);
    } else if (maxNumber == 10) {
      setDiceStates((prevState) => ({
        ...prevState,
        d10: {
          ...prevState.d10,
          displayedValue: null,
        },
      }));
      setIsD10Spinning(true);
    }
    setTimeout(() => {
      const newValue = Math.floor(Math.random() * maxNumber) + 1; // Randomize dice value
      if (maxNumber == 20) {
        setDiceStates((prevState) => ({
          ...prevState,
          d20: {
            ...prevState.d20,
            value: [...prevState.d20.value, newValue],
            displayedValue: newValue,
            rolls: prevState.d20.rolls + 1,
          },
        }));
        setIsD20Spinning(false);
        // set floating number animation for d20
        if (diceStates.d20.isGlowActive) {
          setFloatingValue(newValue); // Use newValue directly
          setTimeout(() => {
            setFloatingValue(null);
          }, 8000);
        }
      } else if (maxNumber == 4) {
        setDiceStates((prevState) => ({
          ...prevState,
          d4: {
            ...prevState.d4,
            value: [...prevState.d4.value, newValue],
            displayedValue: newValue,
            rolls: prevState.d4.rolls + 1,
          },
        }));
        setIsD4Spinning(false);
        if (diceStates.d4.isGlowActive) {
          setFloatingValue(newValue); // Use newValue directly
          setTimeout(() => {
            setFloatingValue(null);
          }, 8000);
        }
      } else if (maxNumber == 6) {
        setDiceStates((prevState) => ({
          ...prevState,
          d6: {
            ...prevState.d6,
            value: [...prevState.d6.value, newValue],
            displayedValue: newValue,
            rolls: prevState.d6.rolls + 1,
          },
        }));
        setIsD6Spinning(false);
        if (diceStates.d6.isGlowActive) {
          setFloatingValue(newValue); // Use newValue directly
          setTimeout(() => {
            setFloatingValue(null);
          }, 8000);
        }
      } else if (maxNumber == 8) {
        setDiceStates((prevState) => ({
          ...prevState,
          d8: {
            ...prevState.d8,
            value: [...prevState.d8.value, newValue],
            displayedValue: newValue,
            rolls: prevState.d8.rolls + 1,
          },
        }));
        setIsD8Spinning(false);
        if (diceStates.d8.isGlowActive) {
          setFloatingValue(newValue); // Use newValue directly
          setTimeout(() => {
            setFloatingValue(null);
          }, 8000);
        }
      } else if (maxNumber == 10) {
        setDiceStates((prevState) => ({
          ...prevState,
          d10: {
            ...prevState.d10,
            value: [...prevState.d10.value, newValue],
            displayedValue: newValue,
            rolls: prevState.d10.rolls + 1,
          },
        }));
        setIsD10Spinning(false);
        if (diceStates.d10.isGlowActive) {
          setFloatingValue(newValue); // Use newValue directly
          setTimeout(() => {
            setFloatingValue(null);
          }, 8000);
        }
      }
    }, 1600); // Duration to match CSS animation
  };

  useEffect(() => {
    if ((isD4Spinning || isD6Spinning || isD8Spinning || isD10Spinning || isD20Spinning) && !diceSpun.current) {
      diceSpun.current = true;

      const spinTone = new Tone.Player({
        url: "/audio/dice_roll.wav",
      }).toDestination();

      spinTone.autostart = true;

      spinTone.onended = () => {
        spinTone.disconnect();
      };

      spinTone.onerror = (error) => {
        console.error("Error with audio playback", error);
      };
    } else if (diceSpun.current) {
      // timeout keeps the dice spinning sound from occurring alot if spinning dice fast
      setTimeout(() => {
        diceSpun.current = false;
      }, 2000);

      // const landTone = new Tone.Player({
      //   url: "/audio/targeted.wav",
      // }).toDestination();

      // landTone.autostart = true;

      // landTone.onended = () => {
      //   spellTone.disconnect(); // Disconnect the player
      // };

      // landTone.onerror = (error) => {
      //   console.error("Error with audio playback", error);
      // };
    }
  }, [isD4Spinning, isD6Spinning, isD8Spinning, isD10Spinning, isD20Spinning]);

  return (
    <div className="inline-flex relative">
      {floatingValue !== null && (
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-orange-500 font-bold shiny-text blur-text">
          {Object.values(diceStates).some((dice) => dice.rolls < dice.rollsNeeded) ? (
            <>{floatingValue} keep rolling</>
          ) : (
            <>
              {floatingValue} + 2 Deception : {floatingValue + 2}
            </>
          )}
        </div>
      )}
      {totalValue != null && (
        <div
          className="absolute -top-20 left-full ml-60 whitespace-nowrap text-purple-400 font-bold"
          style={{
            fontSize: "1.35rem",
            transform: `translateX(${totalValue >= 10 ? "-43%" : "-33.3333%"})`,
          }}>
          sum: {totalValue}
        </div>
      )}
      <div className={`triangle-container`}>
        <div
          className={`triangle-glow triangle  ${isD4Spinning ? "spinning" : ""} ${isD4Spinning ? "no-glow" : ""} ${
            diceStates.d4.isGlowActive ? "glow-active" : ""
          } ${diceStates.d4.isActive ? "triangle-active" : "triangle-inactive"}`}
          onClick={() => {
            if (!diceStates.d4.inhibit && !isD4Spinning) {
              rollDice(4);
            }
          }}>
          <span className="triangle-text"> {diceStates.d4.displayedValue}</span>
        </div>
      </div>
      <div
        className={`hexagon-glow square ${isD6Spinning ? "spinning no-glow" : ""} ${diceStates.d6.isGlowActive ? "glow-active" : ""} ${
          diceStates.d6.isActive ? "square-active" : "square-inactive"
        }`}
        onClick={() => {
          if (!diceStates.d6.inhibit && !isD6Spinning) {
            rollDice(6);
          }
        }}>
        <span className="square-text">{diceStates.d6.displayedValue}</span>
      </div>
      <div
        className={`hexagon-glow hexagon ${isD20Spinning ? "spinning" : ""} ${isD20Spinning ? "no-glow" : ""} ${
          diceStates.d20.isGlowActive ? "glow-active" : ""
        } ${diceStates.d20.isActive ? "hexagon-active" : "hexagon-inactive"}`}
        onClick={() => {
          if (!diceStates.d20.inhibit && !isD20Spinning) {
            rollDice(20);
          }
        }}>
        {diceStates.d20.displayedValue}
      </div>
      <div
        className={`hexagon-glow d8 ${isD8Spinning ? "spinning" : ""} ${isD8Spinning ? "no-glow" : ""} ${
          diceStates.d8.isGlowActive ? "glow-active" : ""
        } ${diceStates.d8.isActive ? "d8-active" : "d8-inactive"}`}
        onClick={() => {
          if (!diceStates.d8.inhibit && !isD8Spinning) {
            rollDice(8);
          }
        }}>
        <span className="d8-text">{diceStates.d8.displayedValue}</span>
      </div>
      <div
        className={`hexagon-glow d10 ${isD10Spinning ? "spinning" : ""} ${isD10Spinning ? "no-glow" : ""} ${
          diceStates.d10.isGlowActive ? "glow-active" : ""
        } ${diceStates.d10.isActive ? "d10-active" : "d10-inactive"}`}
        onClick={() => {
          if (!diceStates.d10.inhibit && !isD10Spinning) {
            rollDice(10);
          }
        }}>
        {diceStates.d10.displayedValue}
      </div>
    </div>
  );
};

export default HexagonDice;
