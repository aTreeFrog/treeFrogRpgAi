const DiceStates = {
    d20: {
        value: [],
        isActive: true,
        isGlowActive: false,
        rolls: 0,
        displayedValue: null,
        inhibit: false,
        advantage: false,
    },
    d10: {
        value: [10],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 10,
        inhibit: false,
        advantage: false,
    },
    d8: {
        value: [8],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 8,
        inhibit: false,
        advantage: false,
    },
    d6: {
        value: [6],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 6,
        inhibit: false,
        advantage: false,
    },
    d4: {
        value: [4],
        isActive: false,
        isGlowActive: false,
        rolls: 0,
        displayedValue: 4,
        inhibit: false,
        advantage: false,
    }
};


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
    diceStates: { ...DiceStates },
    mode: "story", // story, dice, battle
    activityId: null,
    activeSkill: false,
    skill: "", //the modifier skill that should be highlighted
    timers: {
        duration: 30,
        enabled: false
    },
    battleMode: {
        initiativeRoll: 0,
        yourTurn: false,
        distanceMoved: null,
        actionAttempted: false,
        damageDelt: null,
        enemiesDamaged: [],
        turnCompleted: false,
        mapUrl: null,
        gridData: null,
    },
    figureIcon: null,
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