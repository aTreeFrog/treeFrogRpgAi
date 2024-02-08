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
    fireball: {
        name: "fireball",
        attackBonus: 7,
        damage: "2d6+2",
        type: "spell",
        distance: 62,
        xWidth: 14,
        yWidth: 14
    },
    sword: {
        name: "sword",
        attackBonus: 4,
        damage: "1d6 + 2",
        type: "melee",
        distance: 7,
        xWidth: 7,
        yWidth: 7
    },
    // Add other attacks as needed
};


const player = {
    name: "",
    type: "player",
    active: false,
    away: false, //means the player is away from the computer
    class: "",
    race: "",
    distance: null,
    attacks: { ...attacks },
    initiative: null,
    armorClass: null,
    maxHealth: null,
    currentHealth: null,
    xPosition: null,
    yPosition: null,
    pingXPosition: null,
    pingYPosition: null,
    xScale: 1,
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
        attackRoll: 0,
        attackRollSucceeded: null,
        turnOrder: null,
        yourTurn: false,
        distanceMoved: null,
        actionAttempted: false,
        damageDelt: null,
        usersTargeted: [],
        turnCompleted: false,
        mapUrl: null,
        gridDataUrl: null,
        initiativeImageUrl: null,
        initiativeImageShadow: null,
        targeted: false,
    },
    figureIcon: null,
    backgroundAudio: null,
    userImageUrl: null,
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