import React, { useState } from 'react';
import Select, { components } from 'react-select';

// Custom Dropdown Indicator
const DropdownIndicator = props => {
    return (
        <components.DropdownIndicator {...props}>
            {/* Use a custom icon or text here */}
            ^
        </components.DropdownIndicator>
    );
};

const CustomSelect = ({ options, onChange, value }) => {
    // State to keep track of whether an option was selected
    const [selectedOption, setSelectedOption] = useState(value);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'rgba(107, 33, 168, 1)',
            color: 'white',
            borderColor: 'gray',
            width: '160px',
            minHeight: '25px',
            height: '25px',
            fontWeight: 'semi-bold',
            boxShadow: state.isFocused ? '0 0 0 1px rgba(107, 33, 168, 1)' : 'none',
            outline: state.isFocused ? '1px solid rgba(107, 33, 168, 1)' : 'none',
            '&:hover': {
                borderColor: 'gray',
            },
        }),
        valueContainer: provided => ({
            ...provided,
            padding: '0 6px',
            display: 'flex',
            alignItems: 'center',
        }),
        indicatorsContainer: provided => ({
            ...provided,
            height: '25px',
        }),
        menu: provided => ({
            ...provided,
            backgroundColor: 'rgba(169, 169, 169, 0.3)',
        }),
        menuList: provided => ({
            ...provided,
            paddingTop: '0',
            paddingBottom: '0',
            '::-webkit-scrollbar': {
                width: '8px',
            },
            '::-webkit-scrollbar-track': {
                background: 'rgba(75, 0, 130, 1)',
            },
            '::-webkit-scrollbar-thumb': {
                background: 'rgba(204, 119, 34, 1)',
                borderRadius: '4px',
            },
            '::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(230, 135, 45, 1)',
            },
        }),
        option: provided => ({
            ...provided,
            textAlign: 'left',
            backgroundColor: 'rgba(75, 0, 130, 1)',
            color: 'white',
            '&:hover': {
                backgroundColor: 'rgba(40, 0, 70, 1)',
            },
        }),
        singleValue: provided => ({
            ...provided,
            color: 'white',
        }),
    };

    // Handle selection changes
    const handleChange = (option) => {
        setSelectedOption(option); // Update the internal state with the new option
        if (onChange) onChange(option); // Call the passed onChange prop if available
    };

    const handleMenuOpen = (option) => {
        setIsMenuOpen(true); // Set menu to open
        setSelectedOption(null);
        if (onChange) onChange(option);
    };

    // Handle menu close action
    const handleMenuClose = (option) => {
        //setSelectedOption(option);
    };


    return (
        <Select
            styles={customStyles}
            options={options}
            onChange={handleChange}
            value={selectedOption}
            menuPlacement="auto"
            menuPosition="fixed"
            components={{ DropdownIndicator }}
            placeholder=""
            onMenuOpen={handleMenuOpen}
            onMenuClose={handleMenuClose}
        />
    );
};

export default CustomSelect;
