import React from 'react';
import Select, { components } from 'react-select';

// Custom Dropdown Indicator
const DropdownIndicator = (props) => {
    return (
        <components.DropdownIndicator {...props}>
            {/* Here you can use an up arrow icon. For simplicity, I'm using '^', but you can replace it with an SVG or any other icon component */}
            ^
        </components.DropdownIndicator>
    );
};


const CustomSelect = ({ options, onChange, value }) => {
    const customStyles = {
        control: (provided) => ({
            ...provided,
            backgroundColor: 'gray', // Control background
            color: 'white', // Text color
            borderColor: 'gray', // Border color
            width: '160px',
            minHeight: '25px', // Adjust minimum height as needed
            height: '25px', // Set a fixed height
            fontWeight: 'semi-bold',
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0 6px', // Fine-tune this padding to align the text
            display: 'flex',
            alignItems: 'center', // Align items vertically center
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: '25px', // Ensure same height as control
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'rgba(169, 169, 169, 0.3)',

        }),
        menuList: (provided) => ({
            ...provided,
            paddingTop: '0',
            paddingBottom: '0',
            // Custom scrollbar styles
            '::-webkit-scrollbar': {
                width: '8px',
            },
            '::-webkit-scrollbar-track': {
                background: 'rgba(75, 0, 130, 0.5)', // Same as the dropdown background
            },
            '::-webkit-scrollbar-thumb': {
                background: 'rgba(204, 119, 34, 1)', // Dark amber yellow
                borderRadius: '4px',
            },
            '::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(230, 135, 45, 1)', // Slightly lighter amber on hover
            },
        }),
        option: (provided, state) => ({
            ...provided,
            textAlign: 'left', // Centering text
            backgroundColor: 'rgba(75, 0, 130, 0.5)', // Background of options
            color: 'white', // Text color of options
            '&:hover': {
                backgroundColor: 'rgba(40, 0, 70, 0.8)', // Background of options on hover
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: 'white', // Set the color of the selected value to white
        }),
        // Additional styling can be added here for other parts like menuList, indicators, etc.
    };

    return (
        <Select
            styles={customStyles}
            options={options}
            onChange={onChange}
            value={value}
            menuPlacement="top"
            menuPosition="fixed"
            components={{ DropdownIndicator }}
        />
    );
};

export default CustomSelect;
