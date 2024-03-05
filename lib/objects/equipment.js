const equipment = {
  healthPotion: {
    name: "Health Potion",
    icon: "icons/healthpotion.svg",
    quantity: 1,
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

module.exports = { equipment };
