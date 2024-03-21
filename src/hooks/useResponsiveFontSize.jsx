import { useEffect, useState } from 'react';

const useResponsiveFontSize = () => {
    const [fontSize, setFontSize] = useState('1rem');

    useEffect(() => {
        const calculateFontSize = () => {
            const width = window.innerWidth;
            const size = Math.max(16, Math.min(24, width / 80)) + 'px'; // Adjust the formula as needed
            console.log("fontsize", size);
            setFontSize(size);
        };

        calculateFontSize();

        window.addEventListener('resize', calculateFontSize);

        return () => window.removeEventListener('resize', calculateFontSize);
    }, []);

    return fontSize;
};

export default useResponsiveFontSize;
