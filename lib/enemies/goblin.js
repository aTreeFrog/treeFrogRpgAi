const { player, DiceStates } = require("../objects/player"); // Adjust the path as necessary

const attacks = {
  fireball: {
    name: "fireball",
    attackBonus: 7,
    damage: "2d6",
    type: "spell",
    distance: 62,
    xWidth: 14,
    yWidth: 14,
  },
  club: {
    name: "club",
    attackBonus: 4,
    damage: "1d6 + 2",
    type: "melee",
    distance: 7,
    xWidth: 7,
    yWidth: 7,
  },
  // Add other attacks as needed
};

const equipment = {
  Health: {
    name: "Health Potion",
    icon: "icons/healthpotion.svg",
    quantity: 7,
    duration: "n/a",
    type: "potion",
    impact: "+10",
    property: "currentHealth",
    description: "Mystical red liquid to heal your wounds.",
  },
  randomTeleport: {
    name: "Random Teleport",
    icon: "icons/healthpotion.svg",
    quantity: 1,
    duration: "n/a",
    type: "scroll",
    impact: "n/a",
    description: "Transports you to a random nearby location",
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
  equipment: { ...equipment },
  initiative: null,
  armorClass: 12,
  maxHealth: 15,
  currentHealth: 15,
  xPosition: null,
  yPosition: null,
  pingXPosition: null,
  pingYPosition: null,
  xScale: 1,
  diceStates: { ...DiceStates },
  mode: "battle", // story, dice, battle:
  settingUpNewScene: false,
  newSceneReady: false,
  activityId: null,
  activeSkill: false,
  skill: "", //the modifier skill that should be highlighted
  timers: {
    duration: 30,
    enabled: false,
  },
  battleMode: {
    initiativeRoll: 0,
    attackRoll: 0,
    attackRollSucceeded: null,
    turnOrder: null,
    yourTurn: false,
    distanceMoved: null,
    actionAttempted: false,
    usedPotion: false,
    attackUsed: null,
    damageDelt: null,
    usersTargeted: [],
    turnCompleted: false,
    mapUrl: null,
    gridDataUrl: null,
    initiativeImageUrl: null,
    initiatveImageShadow: null,
    targeted: false,
    enemyAttackAttempt: "INIT",
    attackSound: "/audio/goblin-attack-1.wav",
    deathSound: "/audio/goblin-death-2.wav",
  },
  figureIcon: "/icons/goblin.svg",
  backgroundAudio: null,
  userImageUrl: null,
};

module.exports = { goblin };
