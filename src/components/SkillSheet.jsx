import React, { useState, useEffect, useRef } from 'react';

export default function SkillSheet({ highlight }) {

    return (
        <div className="relative block p-3 text-white text-serif text-2xl font-semibold rounded"
            style={{ height: '23.5rem', width: '59%', position: 'absolute', top: '27%', left: '29%', backgroundColor: "rgba(45, 55, 72, 0.2)", borderRadius: "5px", boxShadow: '0 0 5px purple, 0 0 5px purple' }}>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "acrobatics" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Acrobatics</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '16px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "animals" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Animals</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "arcana" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Arcana</div>
                    </div >
                    <div className="flex flex-col items-center" style={{ marginLeft: '36px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "athletics" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Athletics</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "deception" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Deception</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '20px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "history" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>History</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "sleight" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Sleight</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '37.5px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "persuasion" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Persuasion</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "stealth" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Stealth</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '36px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "survival" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Survival</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "medicine" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Medicine</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '22.5px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "religion" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Religion</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "insight" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Insight</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '35px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "intimidation" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Intimidation</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "nature" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Nature</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '34.65px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "investigation" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Investigation</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-start mb-2">
                <div className="flex items-end">
                    {/* Container for the number and line */}
                    <div className="flex flex-col items-center" style={{ marginLeft: '-4px' }}>
                        <span className="text-white text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "perception" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Perception</div>
                    </div>
                    <div className="flex flex-col items-center" style={{ marginLeft: '11.5px' }}>
                        <span className="text-white  text-m" style={{ marginRight: '0px', marginBottom: '-4px' }}>+2</span> {/* Adjust with your dynamic number */}
                        <hr className="border-purple-800" style={{ width: '24px', borderTopWidth: '2px', marginBottom: '2px' }} />
                    </div>
                    <div className={highlight?.toLocaleLowerCase() === "performance" ? "highlight-container" : ""}>
                        <div className="text-white text-sm" style={{ marginBottom: '1px', marginLeft: '6px' }}>Performance</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
