import React, { useState, useEffect, useRef } from 'react';

export default function CharacterSheet({ name, race, characterClass, level }) {
    const raceRef = useRef(null);
    const classRef = useRef(null);
    const [raceLineWidth, setRaceLineWidth] = useState('0px');
    const [classLineWidth, setClassLineWidth] = useState('0px');

    useEffect(() => {
        // Calculating for Race
        if (raceRef.current) {
            const textWidth = raceRef.current.offsetWidth;
            setRaceLineWidth(`${Math.ceil(textWidth * 1.5)}px`); // x percent more than text width
        }
        // Calculating for Class
        if (classRef.current) {
            const textWidth = classRef.current.offsetWidth;
            setClassLineWidth(`${Math.ceil(textWidth * 1.5)}px`); // x percent more than text width
        }
    }, [race, characterClass]); // Recalculate when race or class changes

    return (
        <div className="flex items-center mt-4 ml-4 text-left">
            <div>
                <div className="relative inline-block p-3 text-white text-2xl font-bold rounded border-green-custom wavy-edges">
                    {name}
                </div>
                <div className="text-white text-base ml-1 mt-[-4px]">Name</div>
            </div>
            <div className="wavy-detail-box ml-4 bg-red-600 p-2 rounded flex flex-col justify-start items-start text-white h-[calc(2*3rem)] w-64 relative">
                {/* Dynamic Text for Race */}
                <div className="flex flex-col items-start mb-2">
                    <span ref={raceRef} className="text-white text-base">{race}</span>
                    <hr className="border-green-500" style={{ width: raceLineWidth }} />
                    <div className="text-white text-base">Race</div>
                </div>
                {/* Dynamic Text for Class */}
                <div className="flex flex-col items-start">
                    <span ref={classRef} className="text-white text-base">{characterClass}</span>
                    <hr className="border-green-500" style={{ width: classLineWidth }} />
                    <div className="text-white text-base">Class</div>
                </div>
                {/* Level Circle (Center-aligned) */}
                <div className="absolute top-1/2 transform -translate-y-1/2 right-8 ">
                    <div className="bg-blue-500 rounded-full h-16 w-16 flex items-center justify-center">
                        <span className="text-white text-3xl">{level}</span>
                    </div>
                    <div className="text-white text-base text-center mt-2">Level</div>
                </div>
            </div>
        </div>
    );
}
