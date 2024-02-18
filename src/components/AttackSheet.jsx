import React, { useState, useEffect, useRef } from 'react';

// Mock data for testing
const yourDataArray = [
    { name: 'staff', distance: '7ft', atkBonus: '+5', type: '1d6' },
    { name: 'ice blast', distance: '28ft', atkBonus: '+2', type: '1d8+2' },
    { name: 'Item 3', distance: '7ft', atkBonus: '+7', type: 'Type C' },
    { name: 'Item 1', distance: '7ft', atkBonus: '+5', type: 'Type A' },
    { name: 'Item 2', distance: '7ft', atkBonus: '+2', type: 'Type B' },
    { name: 'Item 3', distance: '7ft', atkBonus: '+7', type: 'Type C' },

    // Add more mock data as needed
];

export default function AttackSheet({ player, selectedRow, setSelectedRow, isD20Spinning }) {
    const [hoveredRow, setHoveredRow] = useState(null);
    const [headerGlow, setHeaderGlow] = useState(false);


    useEffect(() => {


        console.log("setHeaderGlow", player);
        if (player && player?.mode == "battle" && player?.battleMode?.yourTurn && !player?.battleMode?.actionAttempted) {

            setHeaderGlow(true);
        } else {

            setHeaderGlow(false);
        }

        //if failed an attack or attacked and dealt damage, no longer highlight any selected attack slots
        if (player?.battleMode?.yourTurn && player?.battleMode?.actionAttempted && (!player?.battleMode?.attackRollSucceeded || player?.battleMode.damageDelt > 0)) {
            setSelectedRow(null);
        }

        console.log("selectedRow", selectedRow);

    }, [player]);

    const getClassName = (item, position) => {
        if (selectedRow === item) {
            return `attackRow${position}Clicked`; // Replace with your selected class names
        } else if (hoveredRow === item) {
            return `attackRow${position}Hovered`; // Replace with your hovered class names
        }
        return "";
    };

    // Function to handle row selection, respecting the actionAttempted condition
    const handleSelectRow = (item) => {
        // Check if action has been attempted; if so, do not allow changing the selected row
        if (player?.battleMode?.actionAttempted || isD20Spinning) {
            console.log("Action has already been attempted. Cannot change selection.");
            return; // Early return to prevent changing the selection
        }

        // If action has not been attempted, allow changing the selected row
        setSelectedRow(selectedRow === item ? null : item);
    };

    return (
        <div className="relative block p-3 "
            style={{
                height: '23.5rem',
                width: '95%',
                position: 'absolute',
                top: '27%', // Adjust the top position as needed
                left: '2.5%',
                borderRadius: '5px',
                backgroundColor: headerGlow ? 'rgba(204, 166, 96, 0.1)' : 'rgba(45, 55, 72, 0.2)',
                boxShadow: headerGlow ? '0 0 5px rgb(204, 85, 0), 0 0 8px rgb(204, 85, 0)' : 'none',
                //animation: headerGlow ? 'glowing 4s infinite' : 'none',
            }}
        >
            <div className="absolute top-1/2 left-1/2 overflow-auto scrollable-container transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-opacity-20">
                <div className="grid grid-cols-4 text-white font-semibold text-center whitespace-nowrap">
                    <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`}>Name</button>
                    <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`}>Distance</button>
                    <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`} style={{ paddingLeft: '5px' }}>ATK Bonus</button>
                    <button onClick={() => handleSelectRow(null)} className={`p-3 text-sm attack-header-border`}>Damage</button>
                    {/* Dynamic data cells */}
                    {/* Use a mapping function to generate the data cells dynamically */}
                    {yourDataArray.map((item, index) => (
                        <React.Fragment key={index}>
                            <button
                                onClick={() => handleSelectRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, 'Left')}`}
                                onMouseEnter={() => setHoveredRow(item)}
                                onMouseLeave={() => setHoveredRow(null)}>
                                {item.name}
                            </button>
                            <button
                                onClick={() => handleSelectRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, 'Distance')}`}
                                onMouseEnter={() => setHoveredRow(item)}
                                onMouseLeave={() => setHoveredRow(null)}>
                                {item.distance}
                            </button>
                            <button
                                onClick={() => handleSelectRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, '')}`}
                                onMouseEnter={() => setHoveredRow(item)}
                                onMouseLeave={() => setHoveredRow(null)}
                            > {item.atkBonus}
                            </button>
                            <button
                                onClick={() => handleSelectRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, 'Right')}`}
                                onMouseEnter={() => setHoveredRow(item)}
                                onMouseLeave={() => setHoveredRow(null)}
                            >{item.type}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

            </div>
        </div >

    );
}
