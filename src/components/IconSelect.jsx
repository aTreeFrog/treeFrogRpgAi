import React, { useState, useRef, useEffect } from "react";
import Select, { components } from "react-select";

const { Option } = components;

// Custom Dropdown Indicator
const DropdownIndicator = (props) => {
  return null;
};

const IconOption = (props) => (
  <Option {...props}>
    <div style={{ display: "flex", alignItems: "center", width: "auto" }}>
      {props.data.label}
      {props.data.iconPath && <img src={props.data.iconPath} alt="" style={{ marginLeft: "5px", width: "24px", height: "24px" }} />}
    </div>
  </Option>
);

const IconSelect = ({ options, onChange, player, setIconSelection }) => {
  const [menuIsOpen, setMenuIsOpen] = useState(true);
  const selectRef = useRef(null);

  //this adds the player name to the onChange event for parent
  const internalOnChange = (selectedOption) => {
    // Assuming 'player' is available in this scope, prepare the data to send back
    const extraInfo = { selectedOption, player };

    // Call the parent's callback function with the prepared data
    onChange(extraInfo);
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "rgba(0, 0, 0, 0)", // Make background transparent
      borderColor: "rgba(0, 0, 0, 0)", // Make border transparent
      boxShadow: "none", // Remove shadow
      cursor: "pointer",
      minHeight: "0", // Reduce size
      height: "0", // Set to '0' or minimal as per your need
      overflow: "hidden", // Hide the inner elements
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "25px", // Ensure same height as control
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "rgba(169, 169, 169, 0.3)",
      width: "135px",
      fontSize: "16px",
      borderRadius: "8px",
      marginLeft: "-27px",
      marginBottom: "2px",
    }),
    menuList: (provided) => ({
      ...provided,
      paddingTop: "0",
      paddingBottom: "0",
    }),
    option: (provided) => ({
      ...provided,
      textAlign: "center", // Centering text
      backgroundColor: "rgba(75, 0, 130, 1)", // Background of options
      color: "white", // Text color of options
      fontSize: "16px",
      "&:hover": {
        backgroundColor: "rgba(40, 0, 70, 1)", // Background of options on hover
      },
    }),

    indicatorsContainer: (provided) => ({
      ...provided,
      display: "none", // Hide the indicators container
    }),
    // Additional styling can be added here for other parts like menuList, indicators, etc.
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setMenuIsOpen(false);
        setTimeout(() => {
          setIconSelection((prevState) => ({
            ...prevState, // Spread the previous state to retain the values of other entries
            [player]: false, // Only toggle the state for the specific player's name
          }));
        }, 500); //giving delay to give index.js to update state if user clicks on icon which changes state
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={selectRef}>
      <Select
        styles={customStyles}
        options={options}
        onChange={internalOnChange}
        menuPlacement="top"
        menuPosition="fixed"
        components={{ DropdownIndicator, Option: IconOption }}
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
      />
    </div>
  );
};

export default IconSelect;
