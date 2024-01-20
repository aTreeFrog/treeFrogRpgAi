const attacks = {
    name: "",
    attackBonus: null,
    damage: "",
    type: "",
    distance: null
};

const player = {
    name: "",
    active: false,
    away: false, //means the player is away from the computer
    class: "",
    race: "",
    distance: null,
    attacks: [{ ...attacks }],
    initiative: null,
    armorClass: null,
    maxHealth: null,
    currentHealth: null,
    xPosition: null,
    yPosition: null,
};

module.exports = { player };

// //player object
// const playerObjects = [{
//     name: "aTreeFrog",
//     active: true,
//     class: "Wizard",
//     race: "Elf",
//     distance: 30,
//     attacks: [{
//         name: "staff",
//         attackBonus: 5,
//         damage: "2d6+2",
//         type: "melee",
//         distance: 5
//     }],
//     initiative: 5,
//     armorClass: 14,
//     maxHealth: 30,
//     currentHealth: 30,
//     xPosition: 0,
//     yPosition: 0,
// }];