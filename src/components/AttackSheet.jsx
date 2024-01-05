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

export default function AttackSheet() {
    const [selectedRow, setSelectedRow] = useState(null);

    return (
        <div className="relative block p-3 "
            style={{
                height: '23.5rem',
                width: '69%',
                position: 'absolute',
                top: '27%', // Adjust the top position as needed
                left: '29%',
                backgroundColor: "rgba(45, 55, 72, 0.2)",
            }}
        >
            <div className="absolute top-1/2 left-1/2 overflow-auto scrollable-container transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-opacity-20">
                <div className="grid grid-cols-3 text-white font-semibold text-center whitespace-nowrap">
                    <button onClick={() => setSelectedRow(null)} className="p-3 text-sm attack-header-border">Name</button>
                    <button onClick={() => setSelectedRow(null)} className="p-3 text-sm attack-header-border">ATK Bonus</button>
                    <button onClick={() => setSelectedRow(null)} className="p-3 text-sm attack-header-border">Type</button>
                    {/* Dynamic data cells */}
                    {/* Use a mapping function to generate the data cells dynamically */}
                    {yourDataArray.map((item, index) => (
                        <React.Fragment key={index}>
                            <button onClick={() => setSelectedRow(item)} className={`p-3 text-base mt-1 ${selectedRow === item ? "attackRowLeftClicked" : ""}`}>{item.name}</button>
                            <button onClick={() => setSelectedRow(item)} className={`p-3 text-base mt-1 ${selectedRow === item ? "attackRowClicked" : ""}`}> {item.atkBonus}</button>
                            <button onClick={() => setSelectedRow(item)} className={`p-3 text-base mt-1 ${selectedRow === item ? "attackRowRightClicked" : ""}`}>{item.type}</button>
                        </React.Fragment>
                    ))}
                </div>

            </div>
        </div >

    );
}
