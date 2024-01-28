const { player, DiceStates } = require('../objects/player'); // Adjust the path as necessary

const attacks = {
    fireball: {
        name: "fireball",
        attackBonus: 7,
        damage: "2d6",
        type: "spell",
        distance: 62
    },
    club: {
        name: "club",
        attackBonus: 4,
        damage: "1d6 + 2",
        type: "melee",
        distance: 7
    },
    // Add other attacks as needed
};

const goblin = {
    ...player,
    name: "goblin",
    type: "enemy",
    active: false,
    away: false, //means the player is away from the computer
    class: "fighter",
    race: "goblin",
    distance: 30,
    attacks: { ...attacks },
    initiative: null,
    armorClass: 12,
    maxHealth: 15,
    currentHealth: 15,
    xPosition: null,
    yPosition: null,
    diceStates: { ...DiceStates },
    mode: "battle", // story, dice, battle
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
        gridDataUrl: null,
        initiativeImageUrl: null,
        initiatveImageShadow: null,
    },
    figureIcon: "/icons/goblin.svg",
    backgroundAudio: null,
};

module.exports = { goblin };