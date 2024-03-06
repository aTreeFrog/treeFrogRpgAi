const equipment = {
  Health: {
    name: "Health",
    icon: "icons/healthpotion.svg",
    quantity: 1,
    duration: "n/a",
    type: "potion",
    impact: "+10",
    property: "currentHealth",
    description: "Mystical red liquid to heal your wounds.",
  },
  RandomTeleport: {
    name: "RandomTeleport",
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
