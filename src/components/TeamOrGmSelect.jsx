import React from 'react';
import Select, { components } from 'react-select';

// Custom Dropdown Indicator
const DropdownIndicator = (props) => {
    return null;
};


const TeamOrGmSelect = ({ options, onChange, value }) => {
    const customStyles = {
        control: (provided, state) => {
            let style = {
                ...provided,
                backgroundColor: 'rgba(91, 145, 60, 0.5)', // Control background
                color: 'white', // Text color
                borderColor: 'rgba(91, 145, 60, 0.5)', // Border color
                width: '29px',
                minHeight: '42px', // Adjust minimum height as needed
                height: '42px', // Set a fixed height
                marginLeft: '0px',
                //fontWeight: 'semi-bold',
                fontSize: '12px',
                boxShadow: '1px 1px 1px rgba(91, 145, 60, 0.5)',
                borderRadius: '2px',
                outline: 'rgba(91, 145, 60, 0.5)',
                '&:hover': {
                    borderColor: 'rgba(91, 145, 60, 0.5)'
                },
                cursor: 'pointer'
            };

            if (state.getValue()[0].value === 'Team') { // Assuming 'team' is the value for "Teams"
                style = {
                    ...style, width: '42px', backgroundColor: 'rgba(176, 165, 37,0.5)', outline: 'rgba(176, 165, 37,0.5)', borderColor: 'rgba(176, 165, 37,0.5)', boxShadow: '1px 1px 1px rgba(176, 165, 37,0.5)', outline: 'rgba(176, 165, 37,0.5)',
                    '&:hover': {
                        borderColor: 'rgba(176, 165, 37,0.5)'
                    },
                }; // Adjust this value as needed
            }

            return style;
        },
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
            width: '70px',
            fontSize: '16px',
            borderRadius: '8px',

        }),
        menuList: (provided) => ({
            ...provided,
            paddingTop: '0',
            paddingBottom: '0',
        }),
        option: (provided) => ({
            ...provided,
            textAlign: 'left', // Centering text
            backgroundColor: 'rgba(75, 0, 130, 1)', // Background of options
            color: 'white', // Text color of options
            fontSize: '16px',
            '&:hover': {
                backgroundColor: 'rgba(40, 0, 70, 1)', // Background of options on hover
            },
        }),
        singleValue: (provided, state) => {
            let style = {
                ...provided,
                color: 'white', // Set the color of the selected value to white
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                height: '80%',
                marginTop: '10px',
                marginLeft: '0px'
            };

            if (state.getValue()[0].value === 'Team') { // Assuming 'team' is the value for "Teams"
                style = {
                    ...style, marginLeft: '-2px',
                }; // Adjust this value as needed
            }

            return style;
        },

        indicatorsContainer: (provided) => ({
            ...provided,
            display: 'none', // Hide the indicators container
        }),
        placeholder: (provided, state) => ({
            ...provided,
            // Similar alignment adjustments as singleValue
            display: 'flex',
            alignItems: 'center',
            height: '80%',
            // other styles...
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
            isSearchable={false}
        />
    );
};

export default TeamOrGmSelect;
