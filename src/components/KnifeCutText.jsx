import React, { useEffect } from 'react';

const KnifeCutText = ({ text }) => {
    useEffect(() => {
        const letters = document.querySelectorAll('.cut-text-letter');
        letters.forEach((letter, index) => {
            // Delayed addition of animation class
            setTimeout(() => {
                letter.style.opacity = "1"; // Set the opacity to 1
                letter.style.animation = "cut-animation 0.5s forwards";
            }, index * 1000); // Adjust timing as needed
        });
    }, [text]);

    const letterElements = text.split('').map((letter, index) => (
        <span key={index} className="cut-text-letter">{letter}</span>
    ));

    return <div className="cut-text">{letterElements}</div>;
};

export default KnifeCutText;
