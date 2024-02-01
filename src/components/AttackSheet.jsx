import React, { useState, useEffect, useRef } from 'react';

// Mock data for testing
const yourDataArray = [
    { name: 'Item 1', atkBonus: '+5', type: 'Type A' },
    { name: 'Item 2', atkBonus: '+2', type: 'Type B' },
    { name: 'Item 3', atkBonus: '+7', type: 'Type C' },
    { name: 'Item 1', atkBonus: '+5', type: 'Type A' },
    { name: 'Item 2', atkBonus: '+2', type: 'Type B' },
    { name: 'Item 3', atkBonus: '+7', type: 'Type C' },

    // Add more mock data as needed
];

export default function AttackSheet(player) {
    const [selectedRow, setSelectedRow] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [headerGlow, setHeaderGlow] = useState(false);


    useEffect(() => {

        if (player && player['player'].battleMode?.yourTurn && !player['player']?.battleMode?.actionAttempted) {

            setHeaderGlow(true);
        } else {
            console.log("setHeaderGlow", player['player']);
            setHeaderGlow(false);
        }

    }, [player]);

    const getClassName = (item, position) => {
        if (selectedRow === item) {
            return `attackRow${position}Clicked`; // Replace with your selected class names
        } else if (hoveredRow === item) {
            return `attackRow${position}Hovered`; // Replace with your hovered class names
        }
        return "";
    };

    return (
        <div className="relative block p-3 "
            style={{
                height: '23.5rem',
                width: '69%',
                position: 'absolute',
                top: '27%', // Adjust the top position as needed
                left: '29%',
                borderRadius: '5px',
                backgroundColor: headerGlow ? 'rgba(204, 166, 96, 0.1)' : 'rgba(45, 55, 72, 0.2)',
                boxShadow: headerGlow ? '0 0 5px rgb(204, 85, 0), 0 0 8px rgb(204, 85, 0)' : 'none',
                //animation: headerGlow ? 'glowing 4s infinite' : 'none',
            }}
        >
            <div className="absolute top-1/2 left-1/2 overflow-auto scrollable-container transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-opacity-20">
                <div className="grid grid-cols-3 text-white font-semibold text-center whitespace-nowrap">
                    <button onClick={() => setSelectedRow(null)} className={`p-3 text-sm attack-header-border`}>Name</button>
                    <button onClick={() => setSelectedRow(null)} className={`p-3 text-sm attack-header-border`} style={{ paddingLeft: '5px' }}>ATK Bonus</button>
                    <button onClick={() => setSelectedRow(null)} className={`p-3 text-sm attack-header-border`}>Damage</button>
                    {/* Dynamic data cells */}
                    {/* Use a mapping function to generate the data cells dynamically */}
                    {yourDataArray.map((item, index) => (
                        <React.Fragment key={index}>
                            <button
                                onClick={() => setSelectedRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, 'Left')}`}
                                onMouseEnter={() => setHoveredRow(item)}
                                onMouseLeave={() => setHoveredRow(null)}>
                                {item.name}
                            </button>
                            <button
                                onClick={() => setSelectedRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, '')}`}
                                onMouseEnter={() => setHoveredRow(item)}
                                onMouseLeave={() => setHoveredRow(null)}
                            > {item.atkBonus}
                            </button>
                            <button onClick={() => setSelectedRow(item)} className={`p-3 text-base mt-1 ${getClassName(item, 'Right')}`}
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
