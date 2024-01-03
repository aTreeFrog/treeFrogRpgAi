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
        <div className="mt-4 ml-4 text-left"> {/* Removed flex from this div */}
            {/* Container for both left and right sections */}
            <div className="flex items-start"> {/* Add flex here */}
                {/* Left Section */}
                <div style={{ flex: '0 1 auto', maxWidth: '50%', marginRight: '20px' }}>
                    <div className="mb-1 mt-5"> {/* Wrapper for Name box and label */}
                        <div className="relative inline-block p-3 text-white text-2xl font-bold rounded wavy-edges">
                            {name}
                        </div>
                        <div className="text-white text-base ml-1 mt-[-4px]">Name</div>
                    </div>
                </div>
                {/* Right Section */}
                <div style={{ flex: '1 1 auto', minWidth: '40%', marginRight: '20px' }} className="wavy-detail-box ml-0 mr-2 bg-red-600 p-2 rounded flex flex-col justify-start items-start text-white h-[calc(2*3rem)] w-64 relative">
                    {/* Dynamic Text for Race */}
                    <div className="flex flex-col items-start mb-2">
                        <span ref={raceRef} className="text-white text-base">{race}</span>
                        <hr className="border-amber-600" style={{ width: raceLineWidth }} />
                        <div className="text-white text-base">Race</div>
                    </div>
                    {/* Dynamic Text for Class */}
                    <div className="flex flex-col items-start">
                        <span ref={classRef} className="text-white text-base">{characterClass}</span>
                        <hr className="border-amber-600" style={{ width: classLineWidth }} />
                        <div className="text-white text-base">Class</div>
                    </div>
                    {/* Level Circle (Center-aligned) */}
                    <div className="absolute top-1/2 transform -translate-y-1/2 right-8">
                        <div className="rounded-full h-16 w-16 ml-1 flex items-center justify-center border-2"
                            style={{
                                backgroundColor: "rgba(217, 119, 6, 0.2)", /* Semi-transparent amber background */
                                borderColor: "rgb(217, 119, 6)" /* Solid amber border */
                            }}>
                            <span className="text-white text-3xl">{level}</span>
                        </div>
                        <div className="text-white text-base text-center mt-2">Level</div>
                    </div>
                </div>
            </div>
            {/* New Rectangle below both sections */}
            <div className="relative block p-3 mt-7 text-white text-2xl font-bold rounded wavy-edges" style={{ height: '20rem', width: '95%' }}>
                {/* Optional content or additional styling here */}
            </div>
        </div>

    );
}
