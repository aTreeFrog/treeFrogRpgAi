// server.js at the root of your project
const express = require("express");
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const OpenAI = require("openai");
const path = require("path");
const fs = require("fs");
const stream = require("stream");
const FormData = require("form-data");
// Dynamically import 'node-fetch'
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { player } = require("./lib/objects/player");
const { equipment } = require("./lib/objects/equipment");
const { game } = require("./lib/objects/game");
const { battleRound } = require("./lib/objects/battleRound");
const enemies = require("./lib/enemies");
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const speechFile = path.resolve("./speech.mp3");
const ColorThief = require("colorthief");
const cloneDeep = require("lodash/cloneDeep");
const { AttackAttempt } = require("./lib/enums/AttackAttempt");

const defaultDiceStates = {
  d20: {
    value: [],
    isActive: true,
    isGlowActive: false,
    rolls: 0,
    rollsNeeded: 0,
    displayedValue: null,
    inhibit: false,
    advantage: false,
  },
  d10: {
    value: [10],
    isActive: false,
    isGlowActive: false,
    rolls: 0,
    rollsNeeded: 0,
    displayedValue: 10,
    inhibit: false,
    advantage: false,
  },
  d8: {
    value: [8],
    isActive: false,
    isGlowActive: false,
    rolls: 0,
    rollsNeeded: 0,
    displayedValue: 8,
    inhibit: false,
    advantage: false,
  },
  d6: {
    value: [6],
    isActive: false,
    isGlowActive: false,
    rolls: 0,
    rollsNeeded: 0,
    displayedValue: 6,
    inhibit: false,
    advantage: false,
  },
  d4: {
    value: [4],
    isActive: false,
    isGlowActive: false,
    rolls: 0,
    rollsNeeded: 0,
    displayedValue: 4,
    inhibit: false,
    advantage: false,
  },
};

const defaultBattleMode = {
  initiativeRoll: 0,
  attackRoll: 0,
  attackRollSucceeded: null,
  turnOrder: null,
  yourTurn: false,
  distanceMoved: null,
  attackUsed: null,
  actionAttempted: false,
  usedPotion: false,
  damageRollRequested: false,
  damageDelt: null,
  usersTargeted: [],
  turnCompleted: false,
  mapUrl: null,
  gridDataUrl: null,
  initiativeImageUrl: null,
  initiativeImageShadow: null,
  targeted: false,
  enemyAttackAttempt: "INIT",
  attackSound: null,
  deathSound: null,
};

let shouldContinue = {};
let activityCount = 1;
let chatMessages = [];
let aiInOrderChatMessage = [];
let waitingForUser = false;
let clients = {};
let players = {};
let battleRoundData = {};
let responseSent = new Map();
let waitingForRolls = false;
let awayPlayerCount = 1;
let settingUpNewScene = false;
let msgActivityCount = 1;
let processingMessage = false;
let activePlayers = 0;
let mapDescription = "";
let playerCountForGame = 1;
let settingUpNextScene = false;
let dallECallModifier = false; //alternate to cut dall e calls in half
let storyFile;
let longRestFile;
let currentAct = "";
let currentScene = "";
let newSceneData = "";
let endOfSceneSummary = "";
let equipmentFoundData = {};
let sceneRules = "";

serverRoomName = "WizardsAndGoblinsRoom";

app.prepare().then(() => {
  // HTTP Server for Next.js
  const httpServer = express();

  httpServer.all("*", (req, res) => {
    return handle(req, res);
  });

  console.log("__dirname: ", __dirname);
  // to handle sending audio urls to front end
  httpServer.use("/audio", express.static("public/audio"));
  httpServer.use("/battlemaps", express.static("public/battleMaps"));
  httpServer.use("/images", express.static("public/images"));

  httpServer.all("*", (req, res) => {
    return handle(req, res);
  });

  const nextJsServer = createServer(httpServer);

  // Separate HTTP Server for WebSocket
  // const wsServer = createServer((req, res) => {
  //     res.writeHead(404);
  //     res.end();
  // });

  nextJsServer.listen(3000, () => {
    console.log("Next.js is ready on http://localhost:3000");
  });

  const io = new Server(nextJsServer, {
    path: "/api/chat",
    cors: {
      origin: "*", // Adjust as necessary
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    function startOfGame() {
      const dateStamp = new Date().toISOString();
      currentAct = "Act1";
      currentScene = "Scene1";
      game.mode = "startOfGame";
      game.battleGrid = null;
      game.image = null;
      game.activityId = `game${serverRoomName}-activity${activityCount}-${dateStamp}`;
      for (let user in players) {
        if (players.hasOwnProperty(user) && players[user].type == "enemy") {
          console.log("deleting player", user);
          delete players[user];
        }
        if (players.hasOwnProperty(user) && players[user].type == "player") {
          players[user].diceStates = cloneDeep(defaultDiceStates);
          players[user].battleMode = { ...defaultBattleMode };
          players[user].pingXPosition = null;
          players[user].pingYPosition = null;
          players[user].mode = "startOfGame";
          players[user].shortRests = 0;
          players[user].longRests = 0;
          players[user].longRestRequest = false;
          players[user].story.act = currentAct;
          players[user].story.scene = currentScene;
          players[user].story.locationName = storyFile[currentAct][currentScene].locationName;
          players[user].story.locationDetails = storyFile[currentAct][currentScene].locationDetails;
          players[user].backgroundColor = "bg-black";
          players[user].backgroundAudio = `http://localhost:3000/audio/the_chamber.mp3`;
          players[user].backgroundAudioSecond = null;
          players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
        }
      }

      message = `${storyFile[currentAct][currentScene].Header}
      
              Pace: "Ease into the story. Ensure the players settle into the story before jumping into the story advancement. Allow the players to freely decide on actions before wrapping up the scene. Start the setting a happy cheery place, an allow the players to interact with the environment before setting the main sequence of the story."

              Proactive Storytelling: "Use the environment to suggest actions aTreeFrog might take, avoiding direct prompts for his next move."

              Narration: "Involve aTreeFrog in scenarios requiring his input. Whenever aTreeFrog requests to do something, determine if the move should require a dice roll and initiate one if so. Prompt for d20 rolls with modifiers like stealth or perception as needed. Use 'roll a d20 with [modifier]' to instruct."

              Dice Rolls: "After a roll, subtly weave the result into the story, affecting the narrative flow based on the outcome."

              Character Interaction: ${storyFile[currentAct][currentScene].CharacterInteraction}
      
              Story Advancement: ${storyFile[currentAct][currentScene].StoryAdvancement}
        
              Combat Preparation: Before any battle scenario, request an initiative roll to determine combat order.

              Dialogue: "Maintain first-person NPC dialogues for depth, ensuring aTreeFrog's interactions are immersive and contribute to the story. For example: Theo responds 'Well done. lets move on'."

              Guideline for Responses: "Keep all responses under 50 words to maintain engagement and pace. Ensure every part of the narrative builds towards the next scene, incorporating d20 rolls where applicable."

              Finding Items: Regardless of what aTreeFrog is searching for, if there's an opportunity to discover an item, prompt for a dice roll. Upon a successful roll, uniformly respond with "You have found an item" without specifying the item's nature. This ensures consistency and suspense, as the actual item will be determined externally. This approach maintains gameplay integrity and allows for seamless integration with your external item generation mechanism.

              Session Start: Welcome aTreeFrog to 'Wizards and Goblins,' setting the stage for an epic journey. Keep descriptions and exchanges brief and engaging.
              
              "Please note: All responses must adhere to a strict maximum of 50 words to ensure concise and engaging storytelling. 
              This includes descriptions, character interactions, and narrative advancements. Each output, whether setting a scene, 
              the story, or during character exchanges, should be succinct, not exceeding the 50-word limit. Remember to prompt for 
              d20 roll with modifiers where appropriate, and conclude significant segments with 'END OF SCENE' once actions transition 
              the next narrative phase. AND START THE SCENE SLOW for a balanced flow of the story."`;

      // message = `Header: "You're the Dungeon Master in 'Wizards and Goblins,' guiding aTreeFrog, a wizard elf, through an adventure. It starts one cold night as aTreeFrog enters a tavern in an elf village, seeking warmth and company."

      // Beginning: "Let the players settle in. Start with a happy, cozy tavern scene to get comfortable."

      // Pace: "Players choose their actions. Keep the mood light and let them explore the tavern first."

      // Proactive Storytelling: "Suggest possible actions through the environment without direct prompts."

      // Narration: "Include aTreeFrog in decisions. For actions, decide if a dice roll is needed. Use 'roll a d20 with [modifier]' when necessary."

      // Dice Rolls: "Incorporate the dice roll outcomes into the story to influence what happens next."

      // Character Interaction: "aTreeFrog meets Theo, the bartender with a secret assassin life. They chat and bond until villagers report a goblin threat. Theo reveals his assassin skills and proposes a stealth mission to aTreeFrog."

      // Story Advancement: "The quiet of the tavern breaks with news of goblins. Theo and aTreeFrog plan a stealth attack, sneaking out to confront the threat, marking a key story shift. End the scene with 'END OF SCENE.'"

      // Combat Preparation: "Request an initiative roll for battle order before fights."

      // Dialogue: "Use first-person for NPC conversations to deepen engagement. Keep aTreeFrog's interactions rich but concise."

      // Guideline for Responses: "Keep all responses under 50 words for pace and engagement. Every part should lead to the next scene, including necessary dice rolls."

      // Finding Items: Regardless of what aTreeFrog is searching for, if there's an opportunity to discover an item, prompt for a dice roll. Upon a successful roll, uniformly respond with "You have found an item" without specifying the item's nature. This ensures consistency and suspense, as the actual item will be determined externally. This approach maintains gameplay integrity and allows for seamless integration with your external item generation mechanism.

      // Session Start: "Welcome players to the game, keeping the introduction brief and inviting."

      // Note: "All responses should be under 50 words to keep the storytelling engaging and direct. Prompt for dice rolls as needed and end significant scenes with 'END OF SCENE' to smoothly transition."`;

      sceneRules = message;

      const uniqueId = `user${"system"} -activity${activityCount} -${dateStamp} `;
      let serverData = {
        role: "system",
        content: message,
        processed: false,
        id: uniqueId,
        mode: "All",
      };
      activityCount++;
      //send message to ai
      chatMessages.push(serverData);
      io.to(serverRoomName).emit("enter battle mode", game); //not sure i need game object at all yet
      io.to(serverRoomName).emit("players objects", players);
    }

    // toDo make this function
    function leaveBattleMode(success = true) {
      const dateStamp = new Date().toISOString();
      //setup post battle mode for the battle object
      game.mode = "postBattle";
      game.battleGrid = null;
      game.image = null;
      game.activityId = `game${serverRoomName}-activity${activityCount}-${dateStamp}`;

      for (let user in players) {
        // delete any enemies that may still exist
        if (players.hasOwnProperty(user) && players[user].type == "enemy") {
          console.log("deleting player", user);
          delete players[user];
        }
        if (players.hasOwnProperty(user) && players[user].type == "player") {
          players[user].diceStates = cloneDeep(defaultDiceStates);
          players[user].battleMode = { ...defaultBattleMode };
          players[user].currentHealth = players[user].maxHealth;
          players[user].pingXPosition = null;
          players[user].pingYPosition = null;
          players[user].mode = "postBattle";
          players[user].backgroundColor = "bg-black";
          players[user].backgroundAudio = `http://localhost:3000/audio/Dhaka.mp3`;
          players[user].backgroundAudioSecond = null;
          players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
        }
      }

      let message = "";
      if (success) {
        message = `Game Master, following the team's victory in the recent battle, please guide the story forward, 
                  maintaining the continuity and essence of the adventure. 

                  The conclusion of this segment should not leave the story open-ended but should 
                  instead prepare the characters and the audience for the next chapter of their journey, marking a clear and impactful 
                  'END OF SCENE.
                  
                  Guideline for Responses: "Keep all responses under 50 words to maintain engagement and pace. 
                  `;
      } else {
        message = `Game Master, the team has faced a setback in the recent battle, but fate intervened to ensure their journey continues. 
        As we steer the narrative forward from this pivotal moment, creatively weave a rational explanation for the team's survival despite the 
        loss. This could involve an unexpected event, such as a mysterious ally's intervention, a sudden change in the environment that 
        disrupts the battle, or any other serendipitous occurrence that turns the tide in the team's favor at the critical moment.

        Incorporate this twist into the storyline as a natural progression of the plot, allowing it to influence future character development 
        and story arcs. 
        
        The conclusion of this segment should not leave the story open-ended but should 
        instead prepare the characters and the audience for the next chapter of their journey, marking a clear and impactful 
        'END OF SCENE.
        
        Guideline for Responses: "Keep all responses under 50 words to maintain engagement and pace. 
        `;
      }

      const uniqueId = `user${"backend"} -activity${activityCount} -${dateStamp} `;
      let serverData = {
        role: "user",
        content: message,
        processed: false,
        id: uniqueId,
        mode: "All",
      };
      activityCount++;
      //send message to ai
      chatMessages.push(serverData);
      io.to(serverRoomName).emit("enter battle mode", game); //not sure i need game object at all yet
      io.to(serverRoomName).emit("players objects", players);
    }

    async function enterBattleMode(mapName, backgroundMusic, enemyType, enemyCount) {
      const mapUrl = `http://localhost:3000/battlemaps/${mapName}.png`;
      const gridDataUrl = `http://localhost:3000/battlemaps/${mapName}.json`;
      const initGridLocFile = path.join(__dirname, "/public/battleMaps/InitGridLocations.json");
      const initGridData = JSON.parse(fs.readFileSync(initGridLocFile, "utf8"));
      const initiativeUrl = "http://localhost:3000/images/wizardclosegoblins.png";
      const backgroundSong = `http://localhost:3000/audio/${backgroundMusic}.mp3`;

      let shadowColor = await getDominantColor(initiativeUrl);

      const dateStamp = new Date().toISOString();
      //setup battle mode for the battle object
      game.mode = "battle";
      game.battleGrid = gridDataUrl;
      game.image = mapUrl;
      game.activityId = `game${serverRoomName}-activity${activityCount}-${dateStamp}`;

      battleRoundData = {}; //start fresh with battleRoundData since a battle just started.
      const mapData = path.join(__dirname, `public/battleMaps/${mapName}.json`);
      const mapDataJson = JSON.parse(fs.readFileSync(mapData, "utf8"));
      mapDescription = mapDataJson.description;

      activePlayers = 0;
      //update players state for init battle mode
      let i = 0;
      for (let user in players) {
        // figure out how many active players
        if (players.hasOwnProperty(user) && !players[user].away && players[user].type == "player") {
          activePlayers++;
        }

        // delete any enemies that may have existed in previous battles
        if (players.hasOwnProperty(user) && players[user].type == "enemy") {
          console.log("deleting player", user);
          delete players[user];
        }

        if (players.hasOwnProperty(user) && players[user].type == "player") {
          if (players[user].away) {
            players[user].battleMode.initiativeRoll = 1;
            players[user].mode = "battle"; //avoid asking user to roll initiative
            players[user].active = false;
          } else {
            //ToDo: figure out how to do the call for away thing for entering this mode
            players[user].battleMode.initiativeRoll = 0;
            players[user].mode = "initiative";
            players[user].active = true;
          }

          players[user].xPosition = initGridData[mapName].Players[i][0];
          players[user].yPosition = initGridData[mapName].Players[i][1];
          i++;
          players[user].pingXPosition = null;
          players[user].pingYPosition = null;

          players[user].diceStates = cloneDeep(defaultDiceStates);
          players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
          players[user].activeSkill = false;
          players[user].skill = "";

          players[user].battleMode.yourTurn = false;
          players[user].battleMode.distanceMoved = null;
          players[user].battleMode.attackRoll = 0;
          players[user].battleMode.attackRollSucceeded = null;
          players[user].battleMode.actionAttempted = false;
          players[user].battleMode.usedPotion = false;
          players[user].battleMode.damageRollRequested = false;
          players[user].battleMode.damageDelt = null;
          players[user].battleMode.usersTargeted = [];
          players[user].battleMode.turnCompleted = false;
          players[user].battleMode.attackUsed = null;
          players[user].battleMode.mapUrl = mapUrl;
          players[user].battleMode.gridDataUrl = gridDataUrl;
          players[user].battleMode.initiativeImageUrl = initiativeUrl;
          players[user].battleMode.initiativeImageShadow = shadowColor;
          players[user].battleMode.enemyAttackAttempt = AttackAttempt.INIT;
          players[user].battleMode.targeted = false;
          players[user].backgroundAudio = backgroundSong;
          players[user].backgroundAudioSecond = null;

          players[user].diceStates.d20 = {
            value: [],
            isActive: true,
            isGlowActive: true,
            rolls: 0,
            rollsNeeded: 1, //alter based on advantage
            displayedValue: null,
            inhibit: false,
            advantage: false,
          };

          console.log("user roll", players[user].diceStates.d20);

          waitingForRolls = true;

          // set this to > 1 prob but for testing keeping it at 0
          if (activePlayers > 1) {
            players[user].timers.duration = 120; //seconds
            players[user].timers.enabled = true;
            //dont put await, or it doesnt finish since upstream in my messageque im not doing await in the checkforfunction call
            waitAndCall(
              players[user].timers.duration,
              () => forceResetCheck(players[user]),
              () => players[user].timers.enabled
            );
          }
        }
      }

      // place enemy fighters into the players object since they will fight in the game
      for (let j = 0; j < enemyCount && j < 4; j++) {
        const enemyKey = `${enemyType}${j + 1}`;
        players[enemyKey] = { ...enemies[enemyType] }; // Create a new object for each enemy
        players[enemyKey].name = enemyKey;
        players[enemyKey].mode = "battle";
        players[enemyKey].battleMode = { ...players[enemyKey].battleMode }; // Create a new object for each enemy
        players[enemyKey].timers = { ...players[enemyKey].timers };
        players[enemyKey].diceStates = { ...players[enemyKey].diceStates };
        players[enemyKey].battleMode.initiativeRoll = 1; /////REMOVE THIS LATER FOR TESTING ONLY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //players[enemyKey].battleMode.initiativeRoll = Math.floor(Math.random() * 20) + 1; //between 1 and 20
        players[enemyKey].activityId = `user${enemyKey}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
        players[enemyKey].xPosition = initGridData[mapName].Enemies[j][0];
        players[enemyKey].yPosition = initGridData[mapName].Enemies[j][1];
        players[enemyKey].userImageUrl = "http://localhost:3000/userImages/goblin.png";
        defaultPlayersBattleInitMode(enemyKey);

        console.log("xpos", players[enemyKey].xPosition);
        console.log("ypos", players[enemyKey].yPosition);
        console.log("all players with enemies", players);
      }
      activityCount++;

      //initial battleRound data for all players including enemies to be used to summarize rounds.
      Object.entries(players).forEach(([name, player]) => {
        battleRoundData[name] = { ...battleRound };
        battleRoundData[name].type = player.type;
        battleRoundData[name].class = player.class;
        battleRoundData[name].race = player.race;
      });

      console.log("enter battle mode");

      io.to(serverRoomName).emit("enter battle mode", game); //not sure i need game object at all yet
      io.to(serverRoomName).emit("players objects", players);

      // create a dalle image illustrating the begining of a battle.
      battleRoundAISummary(true);
    }

    async function summarizeAndMoveOn() {
      settingUpNewScene = true;

      for (let userName in players) {
        if (players.hasOwnProperty(userName)) {
          players[userName].active = false;
          players[userName].active = false;
          players[userName].currentHealth = players[userName].maxHealth;
          players[userName].diceStates = cloneDeep(defaultDiceStates);
          players[userName].mode = "story";
        }
      }

      let messagesFilteredForApi = chatMessages.map((item) => ({
        role: item.role,
        content: item.content,
      }));

      messagesFilteredForApi.push({
        role: "user",
        content:
          "The players decided to move on without wrapping up this scene. please summarize the story so far, including the details of the decisions each player made so far. Then, make a decision on what the next scene will entale. Even if you were waiting on players to do something, move onto the next scene. Tell us where the players are heading.",
      });

      const data = {
        model: "gpt-3.5-turbo-1106",
        messages: messagesFilteredForApi,
        stream: true,
      };

      let outputMsg = "";

      const completion = await openai.chat.completions.create(data);

      for await (const chunk of completion) {
        outputStream = chunk.choices[0]?.delta?.content;
        outputMsg += outputStream;
        io.to(serverRoomName).emit("chat message", outputStream || "");
      }
      io.to(serverRoomName).emit("chat complete");

      //start chatMessages over again. But dont forget to add instructions to this list.
      chatMessages = [];
      chatMessages.push({
        role: "assistant",
        content: outputMsg,
        processed: true,
      });

      settingUpNewScene = false;

      //need to call function to determine which scene we need to setup next.
    }

    async function processMessages() {
      while (true) {
        if (!waitingForUser && !waitingForRolls && !settingUpNewScene && !processingMessage && !settingUpNextScene) {
          processingMessage = true;

          let unprocessedUserMessages = chatMessages.filter(
            (message) => (message.role === "user" || message.role === "system") && !message.processed
          );

          if (unprocessedUserMessages.length > 0) {
            unprocessedUserMessages.forEach((message) => {
              aiInOrderChatMessage.push(message);
            });

            let outputMsg = "";
            chatMessages.forEach((message) => {
              message.processed = true;
            });

            aiInOrderChatMessage.forEach((message) => {
              message.processed = true;
            });

            console.log("checking chat messages");
            let messagesFilteredForApi = aiInOrderChatMessage.map((item) => ({
              role: item.role,
              content: item.content,
            }));

            const tempContent = `Before responding, Remember to follow the prompt instructions given at the start of this chat history. and ease into the story. Let the players make decisions.`;

            messagesFilteredForApi.push({
              role: "system",
              content: tempContent,
            });

            console.log("messagesFilteredForApi", messagesFilteredForApi);

            const data = {
              model: "gpt-4-0125-preview",
              messages: messagesFilteredForApi,
              temperature: 0.2,
              stream: true,
            };

            serverMessageId = `user - Assistant - activity - ${msgActivityCount} -${new Date().toISOString()} `;

            const completion = await openai.chat.completions.create(data);

            console.log("completion: ", completion);

            for await (const chunk of completion) {
              // // Check if we should continue before emitting the next chunk
              // if (!shouldContinue[socket.id]) {
              //     break; // Exit the loop if instructed to stop
              // }

              let outputStream = {
                message: chunk.choices[0]?.delta?.content || "",
                messageId: serverMessageId,
                role: "assistant",
              };
              outputMsg += outputStream.message;

              io.to(serverRoomName).emit("chat message", outputStream || "");
            }

            msgActivityCount++;

            console.log("made it to chat complete");
            io.to(serverRoomName).emit("chat complete", serverMessageId);
            let completeOutput = {
              role: "assistant",
              content: outputMsg,
              processed: true,
            };
            messagesFilteredForApi.pop(); //remove the follow prompt instructions reminder.
            aiInOrderChatMessage.push(completeOutput);
            chatMessages.push(completeOutput);

            // if all messages are processed, check for function call now
            if (aiInOrderChatMessage.filter((message) => !message.processed).length == 0) {
              checkForFunctionCall(); // don't put await, otherwise it will block people from continuing until timeout occurs or they roll. So others wouldnt be able to type or cancel a roll.
              if (outputMsg.toLowerCase().includes("end of scene")) {
                setupEndOfScene();
              }
            }
          }

          processingMessage = false;
        }

        await new Promise((resolve) => setTimeout(resolve, 200)); // Wait a bit before checking again
      }
    }

    async function setupEndOfScene() {
      //ToDo: this is a big code function to do every time. prob better to first check if end of scene in the other area before doing this mapping.
      let msgsFltrdForEndScene = aiInOrderChatMessage.map((item) => ({
        role: item.role,
        content: item.content,
      }));
      console.log("msgsFltrdForEndScene", msgsFltrdForEndScene);
      //just see if you should call function based on last ai message
      let latestAssistantMessage = [msgsFltrdForEndScene.findLast((item) => item.role === "assistant")];
      console.log("latestAssistantMessage", latestAssistantMessage);
      //only check it to do the roll function if you sense d20 and roll in the ai statement
      if (latestAssistantMessage[0].content.toLowerCase().includes("end of scene")) {
        settingUpNextScene = true;
        const dateStamp = new Date().toISOString();

        // put player objects setting up new scene to true so it inhibits players from typing and notifys scene change.
        for (let user in players) {
          if (players.hasOwnProperty(user) && players[user].type == "enemy") {
            console.log("deleting player", user);
            delete players[user];
          }
          if (players.hasOwnProperty(user) && players[user].type == "player") {
            players[user].diceStates = cloneDeep(defaultDiceStates);
            players[user].battleMode = { ...defaultBattleMode };
            players[user].pingXPosition = null;
            players[user].pingYPosition = null;
            players[user].mode = "story";
            players[user].settingUpNewScene = true;
            players[user].newSceneReady = false;
            players[user].backgroundColor = "bg-black";
            players[user].backgroundAudio = `http://localhost:3000/audio/the_chamber.mp3`;
            players[user].backgroundAudioSecond = null;
            players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
          }
        }

        activityCount++;
        io.to(serverRoomName).emit("players objects", players);

        const msg = `"Based on the dialogue and interactions that have occurred between the characters (players) and the Dungeon Master 
        (assistant) in our 'Wizards and Goblins, an AI-based Role Playing Game,' please provide a comprehensive summary. 
        Highlight the following aspects:

        1. Current Location and Situation: Where did the players end their journey in the story, and what is the 
        current setting or situation they find themselves in? 
        2. Non-Player Characters (NPCs): List any NPCs who are actively involved or following the players. 
        Describe their roles and how they're contributing to the story.
        3. Key Developments: Summarize any major plot developments, encounters, or decisions made by the players 
        that significantly impact the story's progression.
        4. Pending Actions or Decisions: Note any immediate actions or decisions that the players are expected to 
        make as the story continues.

        Please ensure this summary focuses solely on the story's progression and character interactions, 
        without including any of the initial instructions or meta-conversations provided by the role labeled 'user'. 
        This summary will serve as a foundation for seamlessly continuing the narrative in the next scene, 
        ensuring consistency and coherence in the storytelling experience."`;
        msgsFltrdForEndScene.push({
          role: "system",
          content: msg,
        });
        const data = {
          model: "gpt-4-0125-preview",
          messages: msgsFltrdForEndScene,
          stream: false,
        };
        const completion = await openai.chat.completions.create(data);
        endOfSceneSummary = completion.choices[0].message.content;
        console.log("end of scene summary: ", completion.choices[0].message.content);
      }
    }

    socket.join(serverRoomName); //name of conference room
    console.log("a user connected:", socket.id);

    //Dice Roll Function Message Creator and sender
    async function sendDiceRollMessage(skillValue, advantageValue, users) {
      //find number of active players. If more then one, set timer to make game faster
      let activePlayers = 0;
      for (let key in players) {
        if (players.hasOwnProperty(key) && !players[key].away && players[key].type == "player") {
          activePlayers++;
        }
      }

      if (typeof users === "string") {
        //ai sent the users as a string with , seperated. instead of an array. So need to filter
        var namesArray = users.split(",");
      } else {
        var namesArray = users;
      }

      for (var i = 0; i < namesArray.length; i++) {
        let user = namesArray[i].trim();

        console.log("user: ", user);

        if (players[user] && players[user]?.mode != "dice" && !players[user].away && players[user].type == "player") {
          players[user].active = true;
          players[user].mode = "dice";
          players[user].activeSkill = skillValue.length > 0;
          players[user].skill = skillValue;
          players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;

          players[user].diceStates.d20 = {
            value: [],
            isActive: true,
            isGlowActive: true,
            rolls: 0,
            rollsNeeded: 1, // alter based on advantage
            displayedValue: null,
            inhibit: false,
            advantage: advantageValue,
          };
          waitingForRolls = true;

          //ToDo: lots of bugs here, figure it out!!!!!!!!!!!!!
          // players[user].timers.duration = 240;
          // players[user].timers.enabled = true;
          // //dont put await, or it doesnt finish since upstream in my messageque im not doing await in the checkforfunction call
          // waitAndCall(
          //   players[user].timers.duration,
          //   () => forceResetCheck(players[user]),
          //   () => players[user].timers.enabled
          // );
        }
      }

      // const activityId = `activity${ activityCount } -${ new Date().toISOString() } `;
      // const diceRollMessage = {
      //     Action: "DiceRoll",
      //     D20: true,
      //     D10: false,
      //     D8: false,
      //     D6: false,
      //     D4: false,
      //     Skill: skillValue,
      //     Advantage: Boolean(advantageValue),
      //     Disadvantage: false,
      //     Id: uniqueId,
      //     User: "aTreeFrog"
      // };
      // Sending the message to the connected client
      //io.to(serverRoomName).emit('dice roll', diceRollMessage); //ToDo. determine who to send this too

      console.log("dice roll message");
      io.to(serverRoomName).emit("players objects", players);

      activityCount++;
    }

    function waitAndCall(duration, func, checkCondition) {
      return new Promise((resolve) => {
        const intervalTime = 2000; // Check every 1 second, adjust as needed
        let intervalId;

        const timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          func();
          resolve();
        }, duration * 1000);

        intervalId = setInterval(() => {
          //if checkCondition is false, cancel the function call
          if (!checkCondition()) {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            resolve();
          }
        }, intervalTime);
      });
    }

    // if timer expired and player is still active, set them to away and not active and
    // send default dice roll message to AI to take them out of the game.
    function forceResetCheck(player) {
      if (player?.active) {
        console.log("forceResetCheck");

        let message = "Game master, I stepped away from the game. Please do not include me in your story until I return.";
        const uniqueId = `user${player.name} -activity${awayPlayerCount} -${new Date().toISOString()} `;
        let serverData = {
          role: "user",
          content: message,
          processed: false,
          id: uniqueId,
          mode: "All",
        };
        awayPlayerCount++;
        //send message to users and ai
        chatMessages.push(serverData);
        io.to(serverRoomName).emit("latest user message", serverData);
        responseSent.set(serverData.id, true);
        makePlayerInactive(player);
      }
    }

    function makePlayerInactive(player) {
      player.active = false;
      player.away = true;
      player.mode = "story";
      player.diceStates = cloneDeep(defaultDiceStates);
      player.skill = "";
      player.activeSkill = false;
      player.timers.enabled = false;
      player.activityId = `user${player.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;
      activityCount++;

      //send updated entire players object to room

      console.log("make player inactive");
      io.to(serverRoomName).emit("players objects", players);
    }

    // socket.on('chat message', async (msg) => {
    //     try {
    //         playBackgroundAudio();////////////////////////for testing//////////
    //         outputMsg = "";
    //         chatMessages.push(msg); //ToDo: need to identify which user is speaking
    //         console.log("is this getting called?")

    //     } catch (error) {
    //         console.error('Error:', error);
    //         socket.emit('error', 'Error processing your message'); // say to which client
    //     }
    // });

    const queue = []; // Initialize an empty queue

    // TURN BACK ON WHEN YOU ARE READY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    socket.on("audio message", async (msg) => {
      async function processQueue() {
        let narrator = "onyx";
        if (shouldContinue[socket.id] && queue.length > 0) {
          const msg = queue.shift();
          const currentSequence = sequenceNumber++;

          try {
            console.log("audio is getting called?");
            console.log("audio msg: ", msg);
            const data = {
              model: "tts-1",
              voice: narrator,
              input: msg.message,
              speed: 1,
            };
            const mp3 = await openai.audio.speech.create(data);
            const buffer = Buffer.from(await mp3.arrayBuffer());
            // Emit the buffer to the client
            socket.emit("play audio", {
              audio: buffer.toString("base64"),
              sequence: currentSequence,
              messageId: msg.messageId,
            }); //ToDo. for specific user
          } catch (error) {
            console.error("Error:", error);
            socket.emit("error", "Error processing your audio message: ", "sequence", currentSequence);
          } finally {
            if (queue.length > 0) {
              processQueue(); // If there are more items, continue processing
            }
          }
        }
      }

      console.log("audio message: ", msg);
      queue.push(msg); // Add incoming messages to the queue
      processQueue(); // Trigger processing (if not already in progress)//////TURNED OFF
    });

    let sequenceNumber = 0;

    socket.on("reset audio sequence", async (msg) => {
      sequenceNumber = 0;
    });

    socket.on("new scene ready", async (playerName) => {
      if (players.hasOwnProperty(playerName)) {
        players[playerName].newSceneReady = true;
        players[playerName].activityId = `user${playerName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
        activityCount++;
        io.to(serverRoomName).emit("players objects", players);
      }
    });

    socket.on("long rest response", (data) => {
      let longRestData = {};
      if (!players.hasOwnProperty(data.name)) {
        return;
      }
      players[data.name].story.longRestSceneOutcome = data.response;

      if (players[data.name].story.longRestSceneOutcome.toLowerCase() == "accept") {
        const increase = longRestFile[players[data.name]?.story?.longRestStory][players[data.name]?.story.longRestScene].Increase;
        const increaseAmount = longRestFile[players[data.name]?.story?.longRestStory][players[data.name]?.story.longRestScene].IncreaseAmount;
        const increaseIcon = longRestFile[players[data.name]?.story?.longRestStory][players[data.name]?.story.longRestScene].IncreaseIcon;
        const decrease = longRestFile[players[data.name]?.story?.longRestStory][players[data.name]?.story.longRestScene].Decrease;
        const decreaseAmount = longRestFile[players[data.name]?.story?.longRestStory][players[data.name]?.story.longRestScene].DecreaseAmount;
        const decreaseIcon = longRestFile[players[data.name]?.story?.longRestStory][players[data.name]?.story.longRestScene].DecreaseIcon;

        if (increase.toLowerCase() != "n/a") {
          players[data.name][increase] += increaseAmount;
          activityCount++;

          longRestData["increase"] = {
            role: "assistant",
            message: `${data.name} increased ${increase} by ${increaseAmount}`,
            iconPath: increaseIcon,
            mode: "All",
            type: "longRestOutcome",
            activityId: activityCount,
            player: data.name,
          };
        }

        if (decrease.toLowerCase() != "n/a") {
          players[data.name][decrease] -= decreaseAmount;
          activityCount++;

          longRestData["decrease"] = {
            role: "assistant",
            message: `${data.name} decreased ${decrease} by ${decreaseAmount}`,
            iconPath: decreaseIcon,
            mode: "All",
            type: "longRestOutcome",
            activityId: activityCount,
            player: data.name,
          };
        }

        if (increase.toLowerCase() != "n/a" || decrease.toLowerCase() != "n/a") {
          players[data.name].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
          activityCount++;
          io.to(serverRoomName).emit("character alteration", longRestData);
        }
      }

      players[data.name].mode = "endOfLongRest";
      players[data.name].story.longRestImage = null;
      players[data.name].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
      activityCount++;
      io.to(serverRoomName).emit("players objects", players);
    });

    async function checkForFunctionCall() {
      let diceRollCalled = false;

      let messagesFilteredForFunction = aiInOrderChatMessage.map((item) => ({
        role: item.role,
        content: item.content,
      }));
      console.log("messagesFilteredForFunction", messagesFilteredForFunction);
      //just see if you should call function based on last ai message
      let latestAssistantMessage = [messagesFilteredForFunction.findLast((item) => item.role === "assistant")];
      console.log("latestAssistantMessage", latestAssistantMessage);
      //only check it to do the roll function if you sense d20 and roll in the ai statement
      if (
        latestAssistantMessage[0].content.toLowerCase().includes("d20") &&
        latestAssistantMessage[0].content.toLowerCase().includes("roll") &&
        !latestAssistantMessage[0].content.toLowerCase().includes("initiative")
      ) {
        latestAssistantMessage.push({
          role: "user",
          content: "did you specifically request a user to roll a d20 dice? If so, call the sendDiceRollMessage function.",
        });
        console.log("latestAssistantMessage", latestAssistantMessage);
        const data = {
          model: "gpt-3.5-turbo-1106",
          messages: latestAssistantMessage,
          stream: false,
          tools: [
            {
              type: "function",
              function: {
                name: "sendDiceRollMessage",
                description: "function that should be called anytime the AI assistant asks a user to roll a d20 dice.",
                parameters: {
                  type: "object",
                  properties: {
                    skill: {
                      type: "string",
                      enum: ["intelligence", "investigation", "nature", "insight", "stealth", "deception"],
                      description:
                        "Based on the latest conversation from the assistant or bot, what type of skill modifier should be added to the d20 dice roll.",
                    },
                    advantage: {
                      type: "boolean",
                      description:
                        "Determine if the d20 dice roll should be rolled with advantage. The message from the bot or assistant would say the words advantage indicating to do so.",
                    },
                    users: {
                      type: "array",
                      enum: ["aTreeFrog"],
                      description:
                        "Based on the latest conversation history. the Assistant or bot says exactly which players should roll the d20. look for all the players that need to role and add them to this array.",
                    },
                  },
                  required: ["skill", "advantage", "users"],
                },
              },
            },
          ],
        };

        latestAssistantMessage.pop(); //remove what i just added
        const completion = await openai.chat.completions.create(data);
        console.log("checking function call completion: ", completion.choices[0].finish_reason);

        if (completion.choices[0].finish_reason == "tool_calls") {
          functionData = completion.choices[0].message.tool_calls[0].function;
          console.log("checking function call data : ", functionData);

          if (functionData.name == "sendDiceRollMessage") {
            diceRollCalled = true;
            argumentsJson = JSON.parse(functionData.arguments);
            skillValue = argumentsJson.skill;
            advantageValue = argumentsJson.advantage;
            usersValue = argumentsJson.users;
            await sendDiceRollMessage(skillValue, advantageValue, usersValue);

            // return; //dont check for any other function to get called
          }
        }
      }

      // if not in battle mode, see if dalle image should be called.
      const keys = Object.keys(players);

      if (keys.length > 0 && players[keys[0]].mode != "battle") {
        await askAiIfDalleCall(messagesFilteredForFunction);
      }

      if (latestAssistantMessage[0].content.toLowerCase().includes("item") && !diceRollCalled) {
        await requestAiForEquipment(messagesFilteredForFunction);
      }
      // check if initiative roll should be called
      await askAiIfInitiative(messagesFilteredForFunction, diceRollCalled);
    }

    async function requestAiForEquipment(messagesFilteredForFunction) {
      messagesFilteredForFunction.push({
        role: "system",
        content:
          "Did you just tell all or some of the players that they found or obtained any kind of items? If so, call the function giveRandomEquipment.",
      });
      const equipmentData = {
        model: "gpt-4-turbo-preview",
        messages: messagesFilteredForFunction,
        stream: false,
        tools: [
          {
            type: "function",
            function: {
              name: "giveRandomEquipment",
              description: "this function will provide each needed player with obtained equipment from the game",
              parameters: {
                type: "object",
                properties: {
                  users: {
                    type: "array",
                    enum: ["aTreeFrog"],
                    description: "Based on the recent conversation history. the Assistant or bot says exactly which players should receive an item.",
                  },
                },
                required: ["users"],
              },
            },
          },
        ],
        //tool_choice: { type: "function", function: { name: "giveRandomEquipment" } }, //forces model to call this function
      };

      messagesFilteredForFunction.pop(); //remove what i just added
      const equipmentCompletion = await openai.chat.completions.create(equipmentData);
      console.log("equipmentCompletion data", equipmentCompletion);
      console.log("checking equipmentCompletion function call completion: ", equipmentCompletion.choices[0].finish_reason);

      if (equipmentCompletion.choices[0].finish_reason == "tool_calls") {
        functionData = equipmentCompletion.choices[0].message.tool_calls[0].function;
        console.log("checking equipmentCompletion function call data : ", functionData);

        if (functionData.name == "giveRandomEquipment") {
          argumentsJson = JSON.parse(functionData.arguments);
          argValue = argumentsJson.users;
          giveRandomEquipment(argValue);
        }
      }
    }

    async function askAiIfDalleCall(messagesFilteredForFunction) {
      //check if dall e function should be called
      messagesFilteredForFunction.push({
        role: "user",
        content: "Based on this prompt history, has a new scenery change just been made? If so, call the function createDallEImage.",
      });
      const dallEdata = {
        model: "gpt-3.5-turbo-1106",
        messages: messagesFilteredForFunction,
        stream: false,
        tools: [
          {
            type: "function",
            function: {
              name: "createDallEImage",
              description:
                "creates a Dall E image based on the prompt given. The prompt should always be in a dungeons and dragons game theme. Fantasy descriptions and worlds. The prompt will produce an image you would see in a fantasy role playing game book. The prompt should be describing the new scenery we are in.",
              parameters: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description:
                      "The prompt describing what the image should entale. The image should be in the fantasy setting and resemble artwork used in dungeon and dragons role playing games.",
                  },
                },
                required: ["prompt"],
              },
            },
          },
        ],
      };

      messagesFilteredForFunction.pop(); //remove what i just added
      const dallEcompletion = await openai.chat.completions.create(dallEdata);
      console.log("checking function call completion: ", dallEcompletion.choices[0].finish_reason);

      if (dallEcompletion.choices[0].finish_reason == "tool_calls") {
        functionData = dallEcompletion.choices[0].message.tool_calls[0].function;
        console.log("checking function call data : ", functionData);

        if (functionData.name == "createDallEImage") {
          argumentsJson = JSON.parse(functionData.arguments);
          promptValue = argumentsJson.prompt;
          if (!dallECallModifier) {
            createDallEImage(promptValue); ////////////TURN BACK ON!!!////////////////
          }
          dallECallModifier = !dallECallModifier; //toggle modifier back and forth to cut dall e image calls in half
        }
      }
    }

    async function askAiIfInitiative(messagesFilteredForFunction, diceRollCalled) {
      let latestAssistantMessage = [messagesFilteredForFunction.findLast((item) => item.role === "assistant")];

      if (
        !diceRollCalled &&
        latestAssistantMessage[0].content.toLowerCase().includes("initiative") &&
        latestAssistantMessage[0].content.toLowerCase().includes("roll")
      ) {
        messagesFilteredForFunction.push({
          role: "user",
          content:
            "seems like a battle is about to start and your asking to roll for initiative to get the battle turn order? If so call the function enterBattleMode.",
        });
        console.log("enterBattleMode latestAssistantMessage", latestAssistantMessage);
        const data = {
          model: "gpt-3.5-turbo-1106",
          messages: messagesFilteredForFunction,
          stream: false,
          tools: [
            ///////////mapName, backgroundMusic, enemyType, enemyCount
            {
              type: "function",
              function: {
                name: "enterBattleMode",
                description:
                  "function that should be called anytime the AI assistant is about to start a game battle between the players and some enemy.",
                parameters: {
                  type: "object",
                  properties: {
                    mapName: {
                      type: "string",
                      enum: [storyFile[currentAct][currentScene]?.BattleMap],
                      description: "map that should be used for the battle.",
                    },
                    backgroundMusic: {
                      type: "string",
                      enum: ["Black_Vortex"],
                      description: "Background music that should be played for battle. Black_Vortex has an engaging feel.",
                    },
                    enemyType: {
                      type: "string",
                      enum: ["goblin"],
                      description: "the enemy race the players are about to battle.",
                    },
                    enemyCount: {
                      type: "integer",
                      minimum: 1,
                      maximum: 5,
                      description: "the number of enemies the players are going to battle.",
                    },
                  },
                  required: ["mapName", "backgroundMusic", "enemyType", "enemyCount"],
                },
              },
            },
          ],
        };

        messagesFilteredForFunction.pop(); //remove what i just added
        const completion = await openai.chat.completions.create(data);
        console.log("checking function call completion: ", completion.choices[0].finish_reason);

        if (completion.choices[0].finish_reason == "tool_calls") {
          functionData = completion.choices[0].message.tool_calls[0].function;
          console.log("checking function call data : ", functionData);

          if (functionData.name == "enterBattleMode") {
            argumentsJson = JSON.parse(functionData.arguments);
            mapNameValue = argumentsJson.mapName;
            backgroundMusicValue = argumentsJson.backgroundMusic;
            enemyTypeValue = argumentsJson.enemyType;
            enemyCountValue = argumentsJson.enemyCount;
            enterBattleMode(mapNameValue, backgroundMusicValue, enemyTypeValue, enemyCountValue); // no await because theres the active counter going on dont want to block
          }
        }
      }
    }

    async function playBackgroundAudio(song) {
      io.to(serverRoomName).emit("background music", {
        url: `http://localhost:3000/audio/${song}.mp3`,
      });
    }

    socket.on("my user message", (msg) => {
      if (!responseSent.has(msg.id)) {
        waitingForUser = true;

        //means ai is supposed to see and respond to this message
        if (msg.mode.toLowerCase() == "all") {
          // dont send ai roll data if in battle or initiative mode cause thats handled by the d20 complete socket message
          if (
            !(
              (players[msg.player]?.mode == "battle" || players[msg.player]?.mode == "initiative") &&
              msg.content.toLowerCase().includes("i rolled a")
            )
          ) {
            // dont send ai message if in battle mode and user typing is not there turn
            if (!(players[msg.player]?.mode == "battle" && !players[msg.player]?.battleMode.yourTurn)) {
              chatMessages.push(msg);
              console.log("chatMessages: ", chatMessages);

              // auto set message to teams mode so it shows up as different color blob on front end
            } else {
              msg.mode = "Team";
            }
          }
        }
        console.log("received my user message, ", msg);
        io.to(serverRoomName).emit("latest user message", msg);
        responseSent.set(msg.id, true);
        //playBackgroundAudio("lord_of_the_land");////////////////////////for testing//////////
        //createDallEImage("two wizards walking through the forest. Both male. Looking like there could be trouble nearby. lush green forest. nature in an mystical world.");
      }
    });

    socket.on("received user message", (msg) => {
      console.log("all done waiting");
      waitingForUser = false;
    });

    socket.on("cancel processing", () => {
      shouldContinue[socket.id] = false; // Set shouldContinue to false for this socket
    });

    socket.on("resume processing", () => {
      shouldContinue[socket.id] = true;
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

    //jitsi integration
    // Handle creating a meeting
    socket.on("create-meeting", () => {
      const roomName = "Room-" + Date.now(); // Generate unique room name

      // Emit back the room details
      io.to(serverRoomName).emit("meeting-created", {
        roomName: roomName,
        meetingUrl: `https://meet.jit.si/${encodeURIComponent(roomName)}`,
        message: "Meeting created",
      });
    });

    // Handle ending a meeting
    socket.on("end-meeting", () => {
      // Implement logic to handle ending the meeting
      socket.emit("meeting-ended", {
        message: "Meeting ended",
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected");
      // Remove the user from the map on disconnect
      for (let userName in clients) {
        if (clients[userName] === socket.id) {
          delete clients[userName];

          //remove the user from the players array
          if (userName in players) {
            delete players[userName];
          }

          break;
        }
      }
      // Emit the updated list of connected users
      io.to(serverRoomName).emit("connected users", Object.keys(clients));

      console.log("connected user");

      io.to(serverRoomName).emit("players objects", players);
    });

    socket.on("player audio stream", async (arrayBuffer) => {
      // Convert ArrayBuffer to Buffer
      console.log("arrayBuffer: ", arrayBuffer);
      const buffer = Buffer.from(arrayBuffer);
      console.log("buffer: ", buffer);

      const directoryPath = path.join(__dirname, "src", "temp");
      const filePath = path.join(directoryPath, "input.webm");

      // Ensure directory exists
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, buffer);
      const readStream = fs.createReadStream(filePath);

      const data = {
        model: "whisper-1",
        file: readStream,
        language: "en",
        prompt: "ignore silence in the audio file.", // helps produce same output if silent audio coming in
      };
      const sttData = await openai.audio.transcriptions.create(data);
      socket.emit("speech to text data", sttData);
      fs.unlinkSync(filePath); // deletes file
    });

    socket.on("user name", async (userName) => {
      console.log("user name");

      if (clients[userName] && clients[userName] !== socket.id) {
        // Disconnect the previous socket
        let oldSocket = io.sockets.sockets.get(clients[userName]);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }

      // Update the map with the new socket ID
      clients[userName] = socket.id;

      io.to(serverRoomName).emit("connected users", Object.keys(clients));

      //delete existing player data if already there and start fresh if user connects
      if (userName in players) {
        delete players[userName];
      }

      //mock obtaining player info from mongodb
      let newPlayer = {
        ...player, // This copies all keys from players object
        name: userName,
        type: "player",
        active: false,
        away: false,
        class: "Wizard",
        race: "Elf",
        story: {
          act: null,
          scene: null,
          locationName: "",
          locationDetails: "",
          longRestStory: "",
          longRestScene: "",
          longRestImage: null,
          longRestSceneOutcome: "",
        },
        shortRests: 0,
        longRests: 0,
        longRestRequest: false,
        distance: 28,
        attacks: {
          staff: {
            name: "staff",
            attackBonus: 5,
            damage: "1d6",
            type: "melee",
            distance: 7,
            xWidth: 7,
            yWidth: 7,
          },
          iceBlast: {
            name: "ice blast",
            attackBonus: 5,
            damage: "2d6+1d4",
            type: "spell",
            distance: 28,
            xWidth: 14,
            yWidth: 14,
          },
        },
        equipment: {
          Health: {
            name: "Health Potion",
            icon: "icons/healthpotion.svg",
            quantity: 1,
            duration: "n/a",
            type: "potion",
            impact: "+10",
            property: "currentHealth",
            description: "Mystical red liquid to heal your wounds",
          },
          RandomTeleport: {
            name: "Random Teleport",
            icon: "icons/healthpotion.svg",
            quantity: 1,
            duration: "n/a",
            type: "scroll",
            impact: "n/a",
            property: "currentHealth",
            description: "Transports you to a random nearby location",
          },
        },
        initiative: 5,
        armorClass: 14,
        maxHealth: 35,
        currentHealth: 30,
        xPosition: 0,
        yPosition: 0,
        pingXPosition: null,
        pingYPosition: null,
        xScale: 1,
        diceStates: cloneDeep(defaultDiceStates),
        mode: "story",
        settingUpNewScene: false,
        newSceneReady: false,
        timers: {
          duration: 30, //seconds
          enabled: false,
        },
        figureIcon: "/icons/wizard.svg",
        userImageUrl: `http://localhost:3000/userImages/${userName}.png`,
        battleMode: {
          initiativeRoll: 0,
          attackRoll: 0,
          attackRollSucceeded: null,
          turnOrder: null,
          yourTurn: false,
          distanceMoved: null,
          attackUsed: null,
          actionAttempted: false,
          usedPotion: false,
          damageRollRequested: false,
          damageDelt: null,
          usersTargeted: [],
          turnCompleted: false,
          mapUrl: null,
          gridDataUrl: null,
          initiativeImageUrl: null,
          initiativeImageShadow: null,
          targeted: false,
          enemyAttackAttempt: "INIT",
          attackSound: null,
          deathSound: null,
        },
      };

      players[userName] = newPlayer;
      players[userName].activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
      activityCount++;

      console.log("new players joined: ", players);

      io.to(serverRoomName).emit("players objects", players);

      const storyData = path.join(__dirname, `lib/story.json`);
      storyFile = JSON.parse(fs.readFileSync(storyData, "utf8"));
      const longRestData = path.join(__dirname, `lib/longRest.json`);
      longRestFile = JSON.parse(fs.readFileSync(longRestData, "utf8"));

      console.log("longRestFile", longRestFile);

      // lets setup the game
      if (Object.keys(players).length >= playerCountForGame) {
        await runFunctionAfterDelay(() => startOfGame(), 5000);
      }

      //giveRandomEquipment(["aTreeFrog"]); ///FOR TESTING!!!!//////////////////////////////////////////////////

      //enterBattleMode("ForestRiver", "Black_Vortex", "goblin", 3); ////////////FOR TESTING!!!!//////////////////////
    });

    socket.on("obtain all users", () => {
      console.log("obtain all users");

      io.emit("connected users", Object.keys(clients));

      io.emit("players objects", players);
    });

    socket.on("equipment used", (data) => {
      console.log("equipment used ", data);
      internalDate = new Date().toISOString();
      if (data.equipmentData.type == "potion") {
        if (data.equipmentData.name == "Health") {
          const impactNumber = parseInt(data.equipmentData.impact, 10);
          players[data.name].currentHealth = Math.min(players[data.name].maxHealth, players[data.name].currentHealth + impactNumber);

          if (players[data.name].mode == "battle") {
            players[data.name].battleMode.usedPotion = true;
            players[data.name].battleMode.actionAttempted = true;
          }
        }
      }
      players[data.name].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${internalDate}`;
      activityCount++;
      console.log("player equipment used ", players[data.name]);
      io.emit("players objects", players);
    });

    socket.on("short rest", (user) => {
      if (players.hasOwnProperty(user) && players[user]?.mode != "battle" && players[user]?.mode != "initiative") {
        players[user].currentHealth = Math.min(players[user].maxHealth, players[user].currentHealth + 10);
        players[user].shortRests += 1;
        players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
        activityCount++;
      }

      io.emit("players objects", players);
    });

    socket.on("long rest request", (user) => {
      if (players.hasOwnProperty(user) && players[user]?.mode != "battle" && players[user]?.mode != "initiative") {
        players[user].longRestRequest = true;
        players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
        activityCount++;
      }

      io.emit("players objects", players);
    });

    socket.on("cancel long rest request", () => {
      const actDate = new Date().toISOString();

      Object.entries(players).forEach(([userName, playerData]) => {
        playerData.longRestRequest = false;
        playerData.activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${actDate}`;
      });

      io.emit("players objects", players);
    });

    socket.on("D20 Dice Roll Complete", async (diceData) => {
      players[diceData.User].diceStates = cloneDeep(defaultDiceStates); //re-default dice after roll completes

      //reset any modified background colors since roll done.
      players[diceData.User].backgroundColor = null;

      if (players[diceData.User].mode == "initiative") {
        players[diceData.User].battleMode.initiativeRoll = diceData.Total;
      } else if (players[diceData.User].mode == "dice") {
        players[diceData.User].mode = "story";
      } else if (players[diceData.User].mode == "battle" && players[diceData.User].battleMode.attackRoll < 1) {
        players[diceData.User].battleMode.attackRoll = diceData.Total;
        players[diceData.User].battleMode.actionAttempted = true;
        players[diceData.User].battleMode.attackUsed = diceData?.Attack;

        //ToDo: need to account for heal spells. Shouldnt use armor class for that
        players[diceData.User].battleMode.attackRollSucceeded = false; //init, will change if any are true

        // Initially mark all targets for removal, assuming none of them meet the attack roll condition
        let targetsToRemove = new Set(players[diceData.User].battleMode.usersTargeted);

        for (const target of players[diceData.User].battleMode.usersTargeted) {
          console.log("target", target);
          let enemyArmor = players[target]?.armorClass;
          if (players.hasOwnProperty(target) && players[diceData.User].battleMode.attackRoll >= enemyArmor) {
            players[diceData.User].battleMode.attackRollSucceeded = true;
            targetsToRemove.delete(target);
            console.log("target stay", target);
            players[target].battleMode.enemyAttackAttempt = AttackAttempt.SUCCESS;
          } else {
            players[target].battleMode.targeted = false;
            console.log("target remove", target); //that player is no longer targeted
            players[target].battleMode.enemyAttackAttempt = AttackAttempt.FAIL;
          }
        }

        // Filter out the targets marked for removal
        players[diceData.User].battleMode.usersTargeted = players[diceData.User].battleMode.usersTargeted.filter(
          (player) => !targetsToRemove.has(player)
        );

        if (players[diceData.User].battleMode.attackRollSucceeded) {
          //remove default d20 color since other dice needs to roll.
          players[diceData.User].diceStates.d20.isActive = false;
          players[diceData.User].diceStates.d20.value = [];
          players[diceData.User].diceStates.d10.value = [];
          players[diceData.User].diceStates.d8.value = [];
          players[diceData.User].diceStates.d6.value = [];
          players[diceData.User].diceStates.d4.value = [];

          findAndUpdatePlayerDiceStates(players[diceData.User]);

          players[diceData.User].battleMode.damageRollRequested = true;
        }

        // player attacked targets with damage dice. Calculate damage done
      } else if (
        players[diceData.User].mode == "battle" &&
        players[diceData.User].battleMode.attackRollSucceeded &&
        players[diceData.User].battleMode.damageRollRequested
      ) {
        players[diceData.User].battleMode.damageDelt = diceData.Total;

        // ToDo: figure out healing spells

        const dateAct = new Date().toISOString();
        for (const target of players[diceData.User].battleMode.usersTargeted) {
          if (!players.hasOwnProperty(target)) {
            continue;
          }

          players[target].currentHealth = Math.max(0, players[target].currentHealth - players[diceData.User].battleMode.damageDelt);
          players[target].battleMode.enemyAttackAttempt = AttackAttempt.COMPLETE;
          players[target].activityId = `user${target}-game${serverRoomName}-activity${activityCount}-${dateAct}`;
        }

        // did attack and did max move, so auto move player to next turn
        if (players[diceData.User].battleMode.distanceMoved >= players[diceData.User].distance && players[diceData.User].battleMode.damageDelt > 0) {
          //send emit to all players before moving to next player in queue so everyone has latest data quickly.
          players[diceData.User].activityId = `user${diceData.User}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
          activityCount++;
          io.to(serverRoomName).emit("players objects", players);
          setTimeout(async () => {
            await nextInLine();
          }, 2000);
        }

        // after attack, see if all enemies are dead, if so go to story mode
        let allEnemiesDead = true;
        let allPlayersDead = true;
        Object.values(players).forEach((player) => {
          if (player.type == "enemy") {
            if (player.currentHealth > 0) {
              allEnemiesDead = false;
            } else {
              battleRoundData[player.name].died = true;
            }
          } else if (player.currentHealth > 0) {
            allPlayersDead = false;
          }
        });

        // if all enemies dead, call story mode with true for successful battle
        if (allEnemiesDead || allPlayersDead) {
          await runFunctionAfterDelay(() => leaveBattleMode(allEnemiesDead), 10000);
          //return;
        }
      }

      if (
        players[diceData.User].battleMode.distanceMoved >= players[diceData.User].distance &&
        players[diceData.User].battleMode.attackRollSucceeded == false
      ) {
        //send emit to all players before moving to next player in queue so everyone has latest data quickly.
        players[diceData.User].activityId = `user${diceData.User}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
        activityCount++;
        io.to(serverRoomName).emit("players objects", players);
        setTimeout(async () => {
          await nextInLine();
        }, 2000);
      }

      //set a bunch of default states for the player
      //defaultPlayersBattleInitMode(diceData.User);

      players[diceData.User].activityId = `user${diceData.User}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
      activityCount++;

      console.log("d20 completed");
      console.log("dice update data", players[diceData.User].diceStates);
      io.to(serverRoomName).emit("players objects", players);
    });

    function parseDamageValue(damageValue) {
      // Extended regex to match additional dice roll in the bonus part
      const regex = /(\d+)d(\d+)(\+((\d+)d(\d+)|\d+))?/;
      const match = damageValue.match(regex);

      if (match) {
        const a = parseInt(match[1], 10); // Number of primary dice
        const b = parseInt(match[2], 10); // Type of primary dice
        const diceData = [{ a, b }]; // Initialize array with primary dice data

        // Check if there's a bonus part and determine its type (fixed bonus or additional dice roll)
        if (match[3]) {
          const bonus = match[3];
          if (bonus.includes("d")) {
            // Additional dice roll bonus
            const aBonus = parseInt(match[5], 10);
            const bBonus = parseInt(match[6], 10);
            diceData.push({ a: aBonus, b: bBonus }); // Add additional dice roll to the array
          } else {
            // Fixed bonus
            // Directly use match[4] since it captures the numeric part of the fixed bonus
            const fixedBonus = parseInt(match[4], 10);
            diceData.push({ c: fixedBonus }); // Add fixed bonus as part of the array
          }
        }

        return diceData; // Return array containing primary and any additional dice data or fixed bonus
      } else {
        return null; // Return null if the pattern does not match
      }
    }

    function findAndUpdatePlayerDiceStates(player) {
      // Find the attack in player.attacks array
      const attacksArray = Object.values(player.attacks);
      const attack = attacksArray.filter((attack) => attack.name === player.battleMode.attackUsed);

      if (attack[0]) {
        const parts = parseDamageValue(attack[0].damage);
        if (parts && parts.length) {
          parts.forEach((part) => {
            if ("a" in part && "b" in part) {
              const diceType = `d${part.b}`;
              if (player.diceStates[diceType]) {
                player.diceStates[diceType].rollsNeeded = part.a;
                player.diceStates[diceType].isActive = true;
                player.diceStates[diceType].isGlowActive = true;
                player.diceStates[diceType].value = [];
                player.diceStates[diceType].rolls = 0;
                player.diceStates[diceType].displayedValue = null;
                player.diceStates[diceType].inhibit = false;
                console.log(`Updated ${diceType} with rollsNeeded = ${part.a}`);
              } else {
                console.log(`${diceType} does not exist in player's diceStates.`);
              }
            }
            // Handle fixed bonus or additional dice logic here if necessary
          });
        } else {
          console.log("Damage value format is incorrect or no rolls needed.");
        }
      } else {
        console.log("Attack not found.");
      }
    }

    socket.on("playing again", (userName) => {
      //check if any players not away is in battle mode. If so, put this returned player in battle mode
      const battleModeActive = Object.values(players).some((value) => !value.away && value.mode === "battle");

      if (battleModeActive) {
        players[userName].mode = "battle";
      } else {
        players[userName].mode = "story";
      }

      players[userName].active = true;
      players[userName].away = false;
      players[userName].diceStates = cloneDeep(defaultDiceStates);
      players[userName].activeSkill = false;
      players[userName].activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
      activityCount++;

      console.log("playing again");

      io.to(serverRoomName).emit("players objects", players);
    });

    socket.on("story move on", () => {
      let message = "Activated move to next scene sequence";
      const uniqueId = `user${player.name}-activity${awayPlayerCount}-${new Date().toISOString()}`;
      let serverData = {
        role: "user",
        content: message,
        processed: false,
        id: uniqueId,
        mode: "All",
      };
      io.to(serverRoomName).emit("latest user message", serverData);

      summarizeAndMoveOn();
    });

    socket.on("player moved", (data) => {
      if (players.hasOwnProperty(data?.name)) {
        //calculate distance moved
        // Old position
        let oldX = players[data.name].xPosition;
        let oldY = players[data.name].yPosition;

        // New position
        let newX = data.xPosition;
        let newY = data.yPosition;

        // Calculate the number of steps
        let steps = Math.max(Math.abs(newX - oldX), Math.abs(newY - oldY));

        // Each step is equivalent to 7 feet
        let distanceMoved = steps * 7;

        console.log("distanceMoved: ", distanceMoved);

        // Add the distance moved and new x,y position
        players[data.name].battleMode.distanceMoved += distanceMoved;
        players[data.name].xPosition = data.xPosition;
        players[data.name].yPosition = data.yPosition;
        players[data.name].xScale = data.xScale;

        // player attacked and moved as much as they can so change to next person.
        if (players[data.name].battleMode.distanceMoved >= players[data.name].distance && players[data.name].battleMode.actionAttempted) {
          setTimeout(async () => {
            await nextInLine();
          }, 2000);
        }

        players[data.name].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;
        activityCount++;

        io.to(serverRoomName).emit("players objects", players);
      }
    });

    socket.on("ping moved", (data) => {
      if (players.hasOwnProperty(data.name)) {
        // Add the distance moved and new x,y position
        players[data.name].pingXPosition = data.pingXPosition;
        players[data.name].pingYPosition = data.pingYPosition;
        players[data.name].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;
        activityCount++;

        io.to(serverRoomName).emit("players objects", players);
      }
    });

    socket.on("users targeted", (data) => {
      const activityDate = new Date().toISOString();

      if (players.hasOwnProperty(data?.name)) {
        //race condition when we clear players usersTargeted (for next in line)
        //front end sees diff and thinks client side made most recent update and tries
        //to send to server. so server will ignore if not the players turn
        if (players[data.name].battleMode.yourTurn) {
          players[data.name].battleMode.usersTargeted = data.battleMode.usersTargeted;
          players[data.name].xScale = data.xScale;
        }

        //if players targeted and its this players turn and the player hasn't done any action attempt
        // ask to roll d20 for attack
        if (
          !players[data.name].battleMode.actionAttempted &&
          players[data.name].battleMode.yourTurn &&
          players[data.name].battleMode.usersTargeted.length > 0
        ) {
          players[data.name].diceStates.d20 = {
            value: [],
            isActive: true,
            isGlowActive: true,
            rolls: 0,
            rollsNeeded: 1, //alter this based on advantage
            displayedValue: null,
            inhibit: false,
            advantage: false,
          };

          //keep this inhibited for now until you handle the entire sequence of actions
          //waitingForRolls = true;

          // if player removed all targets, reset any active dice rolls.
        } else if (players[data.name].battleMode.usersTargeted.length < 1) {
          players[data.name].diceStates = cloneDeep(defaultDiceStates);
        }

        Object.entries(players).forEach(([userName, playerData]) => {
          if (data?.battleMode?.usersTargeted.includes(userName)) {
            players[userName].battleMode.targeted = true;
          } else {
            players[userName].battleMode.targeted = false;
          }
          players[userName].battleMode.enemyAttackAttempt = AttackAttempt.INIT;
          players[userName].activityId = `user${data.name}-game${serverRoomName}-activity${activityCount}-${activityDate} `;
        });

        activityCount++;

        console.log("users targeted", players);

        io.to(serverRoomName).emit("players objects", players);
      }
    });

    socket.on("end turn", async (playerName) => {
      try {
        if (players.hasOwnProperty(playerName)) {
          if (players[playerName].battleMode.yourTurn) {
            await nextInLine();
            players[playerName].activityId = `user${playerName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
            activityCount++;
            io.to(serverRoomName).emit("players objects", players);
          }
        }
      } catch (error) {
        console.error("Error handling end turn:", error);
        // Handle error appropriately
      }
    });

    socket.on("give equipment", async (data) => {
      try {
        console.log("give equipment data", data);
        const activityDate = new Date().toISOString();
        if (players.hasOwnProperty(data.giveName)) {
          if (players.hasOwnProperty(data.sentName) && players[data.sentName]?.equipment[data.item]) {
            players[data.sentName].equipment[data.item].quantity = Math.min(0, players[data.sentName].equipment[data.item].quantity - data.quantity);
            players[data.sentName].activityId = `user${data.sentName}-game${serverRoomName}-activity${activityCount}-${activityDate} `;
          }
          if (players[data.giveName]?.equipment[data.item]) {
            // Increase the quantity of the existing equipment item
            players[data.giveName].equipment[data.item].quantity += data.quantity;
          } else {
            // Add the equipment item with the initial quantity set to data.quantity
            players[data.giveName].equipment[data.item] = {
              ...equipment[data.item],
              quantity: data.quantity,
            };
          }
          players[data.giveName].activityId = `user${data.giveName}-game${serverRoomName}-activity${activityCount}-${activityDate} `;
        }

        console.log("give equipment player", players[data.giveName]);

        activityCount++;
        io.to(serverRoomName).emit("players objects", players);
      } catch (error) {
        console.error("Error handling give equipment:", error);
        // Handle error appropriately
      }
    });

    processMessages();
  });

  function defaultPlayersBattleInitMode(userName) {
    players[userName].active = false;
    players[userName].away = false;
    players[userName].diceStates = cloneDeep(defaultDiceStates);
    players[userName].battleMode.yourTurn = false;
    players[userName].battleMode.distanceMoved = null;
    players[userName].battleMode.actionAttempted = false;
    players[userName].battleMode.damageRollRequested = false;
    players[userName].battleMode.usedPotion = false;
    players[userName].battleMode.damageDelt = null;
    players[userName].battleMode.usersTargeted = [];
    players[userName].battleMode.turnCompleted = false;
    players[userName].battleMode.targeted = false;
    players[userName].battleMode.attackUsed = null;
    players[userName].battleMode.enemyAttackAttempt = AttackAttempt.INIT;
    players[userName].skill = "";
    players[userName].activeSkill = false;
    players[userName].timers.enabled = false;
  }

  function assignBattleTurnOrder(players) {
    // Convert the object values into an array and then sort
    const playersArray = Object.values(players).sort((a, b) => {
      if (a.battleMode.initiativeRoll === b.battleMode.initiativeRoll) {
        // Randomly return -1 or 1 when there's a tie.
        return Math.random() < 0.5 ? -1 : 1;
      }
      return b.battleMode.initiativeRoll - a.battleMode.initiativeRoll;
    });

    // Assign the turn order and reset 'yourTurn' for all players
    playersArray.forEach((player, index) => {
      player.battleMode.turnOrder = index + 1;
      player.battleMode.yourTurn = false; // Resetting 'yourTurn' for all players
    });

    // Set 'yourTurn' and 'active' to true for the first player in the turn order
    if (playersArray.length > 0) {
      playersArray[0].battleMode.yourTurn = true;
      playersArray[0].active = true;
    }

    // Map the sorted array back to the original object structure
    playersArray.forEach((player) => {
      players[player.name] = player;
    });

    console.log("assign battle turn order");

    io.to(serverRoomName).emit("players objects", players);
  }

  async function battleRoundAISummary(starting = false) {
    let message = "";
    if (starting) {
      message = `"Game master, the team is just starting a battle. Please summarize this opening before the battle
      begins with vivid detail. the battlefield has the following description: ${mapDescription}. The players type "player" are versing the players type "enemy". Here is summary of each player: `;

      Object.entries(battleRoundData).forEach(([player, data]) => {
        message += `name: ${player}, type:${data.type}, race: ${data.race}, class: ${data.class}`;
      });
    } else {
      let message = `"Game master, the team just had a round in battle. Please summarize this battle round 
    scene with vivid detail. Keep your response to 300 characters or less. the battlefield 
    has the following description: ${mapDescription}. The players type "player" are versing the players type "enemy". Here is summary of each players battle round: `;

      Object.entries(battleRoundData).forEach(([player, data]) => {
        message += `name: ${player}, type:${data.type}, race: ${data.race}, class: ${data.class}, AttackAttempted: ${data.attackAttempt}, AttackSuccess: ${data.attackHit}, AttackUsed: ${data.attackUsed}, MovedOnMap: ${data.moved}, Got Hit: ${data.gotHit}, died: ${data.died}. `;
      });
    }

    message += "summarize this for a dall e image prompt for a dungeons and dragons style game";

    console.log("battleRoundAISummary message ", message);

    const uniqueId = `user${"system"} -activity${activityCount} -${new Date().toISOString()} `;
    let serverData = {
      role: "system",
      content: message,
      processed: false,
      id: uniqueId,
      mode: "All",
    };
    activityCount++;
    //send message to ai
    //chatMessages.push(serverData);

    const msgEndOfRound = [
      {
        role: "system",
        content: message,
      },
    ];
    const data = {
      model: "gpt-4-0125-preview",
      messages: msgEndOfRound,
      stream: false,
    };
    const completion = await openai.chat.completions.create(data);
    dalleSummaryMsg = completion.choices[0].message.content;
    console.log("dalle summary msg: ", dalleSummaryMsg);
    createDallEImage(dalleSummaryMsg); /////////////////TURN BACK ON!!!/////////////////////////////////////
  }

  async function nextInLine() {
    let currentPlayerTurnOrder = null;
    let minTurnOrder = Infinity;
    let maxTurnOrder = -Infinity;

    const timeStamp = new Date().toISOString();

    //go through battleRound players and see if they no longer exist, if so that means they died a while back so remove
    Object.entries(battleRoundData).forEach(([name, data]) => {
      if (!players.hasOwnProperty(name) && battleRoundData[name].died) {
        delete battleRoundData[player.name];
      }
    });

    //first go through all players and remove any dead enemies
    let allEnemiesDead = true;
    let allPlayersDead = true;
    let someoneDied = false;
    Object.values(players).forEach((player) => {
      if (player.type == "enemy") {
        if (player.currentHealth > 0) {
          allEnemiesDead = false;
        } else {
          someoneDied = true;
          battleRoundData[player.name].died = true;
          delete players[player.name];
        }
      } else if (player.currentHealth > 0) {
        allPlayersDead = false;
      }
    });

    // if pass true to storymode function, it means successful battle. otherwise players all died and failed.
    if (allEnemiesDead || allPlayersDead) {
      await runFunctionAfterDelay(() => leaveBattleMode(allEnemiesDead), 10000);
      return;
    }

    // First, find the current player, min, and max turnOrder
    Object.values(players).forEach((player) => {
      if (player.battleMode.yourTurn) {
        //create battleRoundData for that players turn
        battleRoundData[player.name].attackAttempt = player?.battleMode?.actionAttempted;
        battleRoundData[player.name].attackHit = player.battleMode.damageDelt >= 1;
        battleRoundData[player.name].moved = player.battleMode.distanceMoved >= 1;

        if (player.battleMode.damageDelt >= 1) {
          battleRoundData[player.name].attackUsed = player.battleMode?.attackUsed;
          for (const target of player.battleMode.usersTargeted) {
            if (battleRoundData.hasOwnProperty(target)) {
              battleRoundData[target].gotHit = true;
            }
          }
        }

        currentPlayerTurnOrder = player.battleMode.turnOrder;

        player.battleMode.yourTurn = false; // End current player's turn
        player.battleMode.turnCompleted = true; //say you completed a turn

        player.activeSkill = false;
        player.skill = "";
        player.battleMode.distanceMoved = null;
        player.battleMode.attackRoll = 0;
        player.battleMode.attackUsed = null;
        player.battleMode.attackRollSucceeded = null;
        player.battleMode.actionAttempted = false;
        player.battleMode.damageRollRequested = false;
        player.battleMode.usedPotion = false;
        player.battleMode.damageDelt = null;
        player.battleMode.usersTargeted = [];
        player.battleMode.enemyAttackAttempt = AttackAttempt.INIT;
        player.battleMode.targeted = false;
        player.activityId = `user${player.name}-game${serverRoomName}-activity${activityCount}-${timeStamp}`;
      }
      if (player.battleMode.turnOrder < minTurnOrder) {
        minTurnOrder = player.battleMode.turnOrder;
      }
      if (player.battleMode.turnOrder > maxTurnOrder) {
        maxTurnOrder = player.battleMode.turnOrder;
      }

      // no one should be targeted anymore.
      player.battleMode.targeted = false;
      player.battleMode.enemyAttackAttempt = AttackAttempt.INIT;
    });

    let foundNextPlayer = false;
    let nextTurnOrder = currentPlayerTurnOrder;
    let attempts = 0;
    const playerCount = Object.keys(players).length;

    do {
      nextTurnOrder = nextTurnOrder === maxTurnOrder ? minTurnOrder : nextTurnOrder + 1;
      const nextPlayer = Object.values(players).find((player) => player.battleMode.turnOrder === nextTurnOrder);

      if (nextPlayer) {
        foundNextPlayer = true;
        // Set the found player's turn to true and reset their state as needed
      }

      attempts++;
    } while (!foundNextPlayer && attempts <= playerCount); // Ensure we only loop through once

    if (!foundNextPlayer) {
      console.log("No eligible players found after a full cycle. Handling end-of-game scenario.");
      // Handle the scenario appropriately here (e.g., end the game, show message)
      return;
    }

    //ToDo: if all player turns completed, explain scene and show picture
    let roundCompleted = true; // Assuming this is declared somewhere in your scope
    const playersArray = Object.values(players);
    for (const player of playersArray) {
      console.log("player turn completed? ", player.name, " ", player?.battleMode?.turnCompleted);
      if (!player?.battleMode?.turnCompleted) {
        roundCompleted = false;
        break; // This will exit the loop if the condition is met
      }
    }

    // if someone died, call round AI summary for dall e image
    if (someoneDied) {
      // dont wait this, so it can move forward quick
      battleRoundAISummary();

      Object.values(players).forEach((player) => {
        player.battleMode.turnCompleted = false;
      });
    }

    // Set the next player's yourTurn to true
    Object.values(players).forEach((player) => {
      if (player.battleMode.turnOrder === nextTurnOrder) {
        player.battleMode.yourTurn = true;
        player.activeSkill = false;
        player.skill = "";
        player.battleMode.distanceMoved = null;
        player.battleMode.attackRoll = 0;
        player.battleMode.attackUsed = null;
        player.battleMode.attackRollSucceeded = null;
        player.battleMode.actionAttempted = false;
        player.battleMode.usedPotion = false;
        player.battleMode.damageRollRequested = false;
        player.battleMode.damageDelt = null;
        player.battleMode.usersTargeted = [];
        player.battleMode.enemyAttackAttempt = AttackAttempt.INIT;
        player.battleMode.targeted = false;
        player.activityId = `user${player.name}-game${serverRoomName}-activity${activityCount}-${timeStamp}`;
      }
    });

    activityCount++;

    console.log("battleRoundData ", battleRoundData);
    io.to(serverRoomName).emit("players objects", players);
  }

  // calculate distance between enemy and selected player
  function calculateDistance(x1, y1, x2, y2) {
    console.log("calculateDistance", x1, y1, x2, y2);
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 7; // Convert grid distance to feet
  }

  // Find all players within melee attack distance
  function findPlayersWithinMeleeDistance(players, enemyXPos, enemyYPos) {
    return players.filter((player) => {
      const playerKey = Object.keys(player)[0]; // Get the key (player name or ID)
      const playerData = player[playerKey]; // Get the player data object
      const distance = calculateDistance(enemyXPos, enemyYPos, playerData.xPosition, playerData.yPosition);
      return distance === 7; // 7 feet away, adjacent on the grid
    });
  }

  function isPositionOccupied(newX, newY, players) {
    return Object.values(players).some((player) => player.xPosition === newX && player.yPosition === newY);
  }

  function findAlternativePosition(enemy, target, players, withinBowRange) {
    // Potential moves are combinations of moving 0, 1, or 2 squares in any direction
    const potentialMoves = withinBowRange ? [0, 1, 2] : [0, 1, 2, 3, 4];
    for (let dx of potentialMoves) {
      for (let dy of potentialMoves) {
        // Calculate potential new positions
        const potentialNewX = enemy.xPosition + dx * (target.xPosition > enemy.xPosition ? 1 : -1);
        const potentialNewY = enemy.yPosition + dy * (target.yPosition > enemy.yPosition ? 1 : -1);

        // Check if the position is occupied
        if (!isPositionOccupied(potentialNewX, potentialNewY, players)) {
          return { x: potentialNewX, y: potentialNewY };
        }
      }
    }

    // If all else fails, stay in place
    return { x: enemy.xPosition, y: enemy.yPosition };
  }

  function moveCloser(enemy, target, withinBowRange = false) {
    const targetKey = Object.keys(target)[0];
    const targetData = target[targetKey];
    // Calculate the number of squares to move horizontally and vertically
    const squaresToMoveX =
      Math.min(Math.abs(targetData.xPosition - enemy.xPosition), withinBowRange ? 2 : 4) * (targetData.xPosition > enemy.xPosition ? 1 : -1);
    const squaresToMoveY =
      Math.min(Math.abs(targetData.yPosition - enemy.yPosition), withinBowRange ? 2 : 4) * (targetData.yPosition > enemy.yPosition ? 1 : -1);

    console.log("squaresToMoveX", squaresToMoveX);
    // If within bow range, randomly decide whether to move closer or stay in place
    //////////////CHANGE BACK TO 0.5 when done testing//////////////////////
    if (withinBowRange && Math.random() < 0.1) {
      console.log("chose to stay in place");
      // Randomly choose to not move (stay in place)
      return { x: enemy.xPosition, y: enemy.yPosition };
    }

    // Calculate new position
    let newX = enemy.xPosition + squaresToMoveX;
    let newY = enemy.yPosition + squaresToMoveY;

    // Adjust for maximum movement within 28 feet (4 squares) or 14 feet (2 squares)
    const distance = calculateDistance(enemy.xPosition, enemy.yPosition, newX, newY);
    if (distance > 28) {
      // If trying to move more than 28 feet, adjust to max 28 feet
      newX = enemy.xPosition + (squaresToMoveX > 0 ? 4 : -4);
      newY = enemy.yPosition + (squaresToMoveY > 0 ? 4 : -4);
    } else if (withinBowRange && distance > 14) {
      // Within bow range and trying to move more than 14 feet, adjust to 14 feet
      newX = enemy.xPosition + (squaresToMoveX > 0 ? 2 : -2);
      newY = enemy.yPosition + (squaresToMoveY > 0 ? 2 : -2);
    }

    // Check if the desired new position is occupied
    if (isPositionOccupied(newX, newY, players)) {
      console.log("Desired position is occupied, looking for alternatives.");
      const alternative = findAlternativePosition(enemy, targetData, players, withinBowRange);
      newX = alternative.x;
      newY = alternative.y;
    }

    // Ensure newX and newY are calculated based on desired logic above
    return { x: newX, y: newY };
  }

  // Decide on action
  function decideAction(players, enemy) {
    // Ensure players is treated as an array whether it's a single object or already an array
    const playersArray = Array.isArray(players) ? players : [players];
    console.log("playersArray", playersArray);

    const playersWithinMeleeDistance = findPlayersWithinMeleeDistance(playersArray, enemy.xPosition, enemy.yPosition);

    if (playersWithinMeleeDistance.length > 0) {
      // If one or more players are within sword distance, randomly select one and attack
      const target = playersWithinMeleeDistance[Math.floor(Math.random() * playersWithinMeleeDistance.length)];
      return {
        action: "meleeAttack",
        target,
        moveTo: { x: enemy.xPosition, y: enemy.yPosition },
      };
    } else {
      // Select a random player to target for potential bow attack or movement
      const target = playersArray[Math.floor(Math.random() * playersArray.length)];
      const playerKey = Object.keys(target)[0];
      const distance = calculateDistance(enemy.xPosition, enemy.yPosition, target[playerKey].xPosition, target[playerKey].yPosition);

      console.log("distance", distance);
      // When deciding to move closer within bow range, pass true for withinBowRange
      if (distance <= 56 && distance > 7) {
        // Within bow range but not adjacent, randomly decide to move closer or stay
        return {
          action: "rangeAttack",
          target,
          moveTo: moveCloser(enemy, target, true),
        };
      } else if (distance > 60) {
        // Too far for either attack, move closer up to 28 feet
        const moveTo = moveCloser(enemy, target);

        return { action: "move", moveTo };
      }
    }
  }

  function emitPlayersAfterDelay(delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        io.to(serverRoomName).emit("players objects", players);
        resolve(); // Resolve the promise when emission is done
      }, delay);
    });
  }

  function runFunctionAfterDelay(callbackFunction, delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        callbackFunction();
        resolve();
      }, delay);
    });
  }

  async function enemyAttackRollEvent(enemy, enemyDecision) {
    // Get the enemy attack list
    const enemyAttacks = Object.values(enemy.attacks);
    console.log("enemyAttacks", enemyAttacks);
    let validAttacks = [];
    if (enemyDecision.action == "rangeAttack") {
      // Filter attacks with distance > 7
      validAttacks = enemyAttacks.filter((attack) => attack.distance > 7);
      console.log("made it to rangeAttack", validAttacks);
    } else if (enemyDecision.action == "meleeAttack") {
      validAttacks = enemyAttacks.filter((attack) => attack.distance < 8);
    }

    if (validAttacks.length < 1) {
      //ToDo: handle invalid attacks. wrap up, assume attack failed maybe?
    }

    const randomIndex = Math.floor(Math.random() * validAttacks.length);
    const selectedAttack = validAttacks[randomIndex];
    console.log("selectedAttack", selectedAttack);

    const attackRollValue = Math.floor(Math.random() * 20) + 1 + selectedAttack.attackBonus;
    console.log("attackRoll", attackRollValue);
    players[enemy.name].battleMode.attackRoll = attackRollValue;
    players[enemy.name].battleMode.attackUsed = selectedAttack.name;
    //ToDo: need to account for heal spells. Shouldnt use armor class for that
    players[enemy.name].battleMode.attackRollSucceeded = false; //init, will change if any are true

    // Initially mark all targets for removal, assuming none of them meet the attack roll condition
    let targetsToRemove = new Set(players[enemy.name].battleMode.usersTargeted);

    const actDate = new Date().toISOString();
    for (const target of players[enemy.name].battleMode.usersTargeted) {
      console.log("target", target);
      let enemyArmor = players[target]?.armorClass;
      if (players.hasOwnProperty(target) && players[enemy.name].battleMode.attackRoll >= enemyArmor) {
        players[enemy.name].battleMode.attackRollSucceeded = true;
        targetsToRemove.delete(target);
        console.log("target stay", target);
        players[target].battleMode.enemyAttackAttempt = AttackAttempt.SUCCESS;
      } else {
        players[target].battleMode.targeted = false;
        console.log("target remove", target); //that player is no longer targeted
        players[target].battleMode.enemyAttackAttempt = AttackAttempt.FAIL;
      }

      players[target].activityId = `user${target}-game${serverRoomName}-activity${activityCount}-${actDate} `;
    }

    // Filter out the targets marked for removal
    players[enemy.name].battleMode.usersTargeted = players[enemy.name].battleMode.usersTargeted.filter((player) => !targetsToRemove.has(player));

    if (players[enemy.name].battleMode.attackRollSucceeded) {
      players[enemy.name].battleMode.damageRollRequested = true;
    }

    players[enemy.name].battleMode.actionAttempted = true;

    players[enemy.name].activityId = `user${enemy.name}-game${serverRoomName}-activity${activityCount}-${actDate} `;

    activityCount++;

    // ToDo: put a try catch here
    await emitPlayersAfterDelay(5000);

    console.log("enemy player after attack roll ", players[enemy.name]);
  }

  async function enemyMoveEvent(enemy, enemyDecision) {
    players[enemy.name].xPosition = enemyDecision.moveTo.x;
    players[enemy.name].yPosition = enemyDecision.moveTo.y;
    players[enemy.name].activityId = `user${enemy.name}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()} `;
    activityCount++;
    await emitPlayersAfterDelay(5000);
  }

  function rollComplexDice(diceNotation) {
    // Split the notation by '+' to handle each part separately (e.g., "1d4", "1d6", "2")
    const parts = diceNotation.split("+").map((part) => part.trim());

    let total = 0;
    parts.forEach((part) => {
      if (part.includes("d")) {
        // If the part includes 'd', it's a dice roll (e.g., "1d4")
        const [numDice, diceValue] = part.split("d").map(Number);
        for (let i = 0; i < numDice; i++) {
          total += Math.floor(Math.random() * diceValue) + 1;
        }
      } else {
        // Otherwise, it's a static modifier (e.g., "2")
        total += parseInt(part, 10);
      }
    });

    return total;
  }

  async function enemyDoDamageEvent(enemy) {
    const enemyAttacks = Object.values(enemy.attacks);
    console.log("enemyAttacks", enemyAttacks);
    const attackData = enemyAttacks.filter((attack) => attack.name == enemy.battleMode.attackUsed);
    console.log("attackData 2", attackData);
    const damageTotal = rollComplexDice(attackData[0].damage);
    console.log("damageTotal", damageTotal);

    players[enemy.name].battleMode.damageDelt = damageTotal;

    // ToDo: figure out healing spells

    const dateAct = new Date().toISOString();
    for (const target of players[enemy.name].battleMode.usersTargeted) {
      if (!players.hasOwnProperty(target)) {
        continue;
      }
      players[target].currentHealth = Math.max(0, players[target].currentHealth - players[enemy.name].battleMode.damageDelt);
      players[target].battleMode.enemyAttackAttempt = AttackAttempt.COMPLETE;
      players[target].activityId = `user${target}-game${serverRoomName}-activity${activityCount}-${dateAct}`;
    }

    activityCount++;
    await emitPlayersAfterDelay(2000);
  }

  async function handleEnemyTurn(playerData) {
    const nonEnemies = Object.entries(players).reduce((acc, [key, value]) => {
      if (value.type !== "enemy") {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log("nonEnemies", nonEnemies);

    console.log("the enemy", playerData);

    const enemyDecision = decideAction(nonEnemies, playerData);

    console.log("enemyDecision", enemyDecision);

    players[playerData.name].battleMode.usersTargeted = [];
    const actDate = new Date().toISOString();
    players[playerData.name].activityId = `user${playerData.name}-game${serverRoomName}-activity${activityCount}-${actDate} `;

    Object.keys(enemyDecision.target).forEach((key) => {
      players[playerData.name].battleMode.usersTargeted.push(key);
      players[key].battleMode.targeted = true;
      players[key].activityId = `user${key}-game${serverRoomName}-activity${activityCount}-${actDate} `;
    });

    activityCount++;
    await emitPlayersAfterDelay(5000);

    //always check if its still the enemies turn. in case client ends turn for enemy, it wont continue.
    //if attack made, do attack action
    if (enemyDecision.action && players[playerData.name].battleMode.yourTurn) {
      await enemyAttackRollEvent(playerData, enemyDecision);
    }

    //if attack roll successful, do the attack
    if (players[playerData.name].battleMode.damageRollRequested && players[playerData.name].battleMode.yourTurn) {
      await enemyDoDamageEvent(playerData);
    }

    if (
      (enemyDecision?.moveTo?.x != playerData?.xPosition || enemyDecision?.moveTo?.y != playerData?.yPosition) &&
      players[playerData.name].battleMode.yourTurn
    ) {
      //always move after attack, in case you moved out of range. and logic doesnt account for re-checking targets after a move...maybe fix that
      await enemyMoveEvent(playerData, enemyDecision);
    }

    if (players[playerData.name].battleMode.yourTurn) {
      setTimeout(async () => {
        await nextInLine();
      }, 2000);
    }
  }

  function findNextScene(currentAct, currentScene, story) {
    const actKeys = Object.keys(story).sort(); // Sort acts to ensure order
    const currentActIndex = actKeys.indexOf(currentAct);
    const sceneKeys = Object.keys(story[currentAct]).sort(); // Sort scenes to ensure order
    const currentSceneIndex = sceneKeys.indexOf(currentScene);

    if (currentSceneIndex < sceneKeys.length - 1) {
      // Next scene in the current act
      return {
        nextAct: currentAct,
        nextScene: sceneKeys[currentSceneIndex + 1],
      };
    } else if (currentActIndex < actKeys.length - 1) {
      // Move to the first scene of the next act
      const nextAct = actKeys[currentActIndex + 1];
      const nextActScenes = Object.keys(story[nextAct]).sort();
      return {
        nextAct: nextAct,
        nextScene: nextActScenes[0],
      };
    } else {
      // End of the story
      return null;
    }
  }

  function longRestNextScene(currentScene, story) {
    const sceneKeys = Object.keys(story).sort(); // Sort scenes to ensure order
    const currentSceneIndex = sceneKeys.indexOf(currentScene);

    if (currentSceneIndex < sceneKeys.length - 1) {
      // Next scene in the current act
      return {
        nextScene: sceneKeys[currentSceneIndex + 1],
      };
    } else {
      // End of the story
      return null;
    }
  }

  async function playLongRestScene(player, multiplePlayers) {
    const msg = `You are a dungeon master for a mystical realm role playing game. Here are your instructions: 
      
      Header: ${longRestFile[player?.story?.longRestStory][player.story.longRestScene].Header}
      
      Player Name: The name of the player you are speaking to is ${player.name}. This is the only player in the game.

      Objective: ${longRestFile[player?.story?.longRestStory][player.story.longRestScene].Objective}

      ResponseDetails: ${longRestFile[player?.story?.longRestStory][player.story.longRestScene].ResponseDetails}

      Output Length: Keep your output to less than 200 words.
      
      `;

    if (multiplePlayers) {
      msg += `First Sentence: Start the output with the following: ${player.name} only you can hear this message. Your friends are unaware of this upcoming discussion.`;
    }

    let msgFiltered = [
      {
        role: "system",
        content: msg,
      },
    ];

    const data = {
      model: "gpt-4-0125-preview",
      messages: msgFiltered,
      stream: true,
    };

    msgActivityCount++;
    serverMessageId = `user - Assistant - activity - ${msgActivityCount} -${new Date().toISOString()} `;

    const completion = await openai.chat.completions.create(data);

    for await (const chunk of completion) {
      let outputStream = {
        message: chunk.choices[0]?.delta?.content || "",
        messageId: serverMessageId,
        role: "assistant",
      };

      io.to(clients[player.name]).emit("chat message", outputStream || "");
    }

    io.to(clients[player.name]).emit("chat complete");
  }

  function startOfLongRest(summaryMsg = "") {
    const actDate = new Date().toISOString();
    let keys = Object.keys(longRestFile);
    let previouslySelectedKey = null;

    let multiplePlayers = Object.keys(players).length > 1;

    Object.entries(players).forEach(async ([userName, playerData]) => {
      if (playerData.type == "player") {
        if (playerData?.story?.longRestStory.length < 1) {
          // randomly select a long rest story
          let selectableKeys = previouslySelectedKey ? keys.filter((key) => key !== previouslySelectedKey) : keys;
          // Select a random key from the filtered keys
          const randomKey = selectableKeys[Math.floor(Math.random() * selectableKeys.length)];
          // Store the randomly selected key for the next iteration
          previouslySelectedKey = randomKey;
          // Access the randomly selected property
          const randomRestStory = longRestFile[randomKey];

          playerData.story.longRestStory = randomKey;
          playerData.story.longRestScene = "Scene1";
          playerData.story.longRestImage = longRestFile[randomKey]["Scene1"].ImageUrl;
        } else {
          const nextSceneInfo = longRestNextScene(playerData.story.longRestStory, longRestFile);
          currentScene = nextSceneInfo.nextScene;
          playerData.story.longRestScene = currentScene;
          playerData.story.longRestImage = longRestFile[randomKey][currentScene].ImageUrl;
        }
        playerData.story.longRestSceneOutcome = null;
        players[userName].activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${actDate} `;
        io.to(serverRoomName).emit("players objects", players);

        playLongRestScene(playerData, multiplePlayers); // dont put await here, so it does it quick for each player without waiting
      }
    });
  }

  function startOfNextScene(summaryMsg = "") {
    const dateStamp = new Date().toISOString();

    const nextSceneInfo = findNextScene(currentAct, currentScene, storyFile);
    currentAct = nextSceneInfo.nextAct;
    currentScene = nextSceneInfo.nextScene;

    game.mode = "nextScene";
    game.battleGrid = null;
    game.image = null;
    game.activityId = `game${serverRoomName}-activity${activityCount}-${dateStamp}`;
    for (let user in players) {
      if (players.hasOwnProperty(user) && players[user].type == "enemy") {
        console.log("deleting player", user);
        delete players[user];
      }
      if (players.hasOwnProperty(user) && players[user].type == "player") {
        players[user].diceStates = cloneDeep(defaultDiceStates);
        players[user].battleMode = { ...defaultBattleMode };
        players[user].pingXPosition = null;
        players[user].pingYPosition = null;
        players[user].mode = "story";
        players[user].shortRests = 0;
        players[user].longRests = 0;
        players[user].longRestRequest = false;
        players[user].story.act = currentAct;
        players[user].story.scene = currentScene;
        players[user].story.locationName = storyFile[currentAct][currentScene].locationName;
        players[user].story.locationDetails = storyFile[currentAct][currentScene].locationDetails;
        players[user].settingUpNewScene = true;
        players[user].backgroundColor = "bg-black";
        players[user].backgroundAudio = `http://localhost:3000/audio/the_chamber.mp3`;
        players[user].backgroundAudioSecond = null;
        players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
      }
    }

    activityCount++;
    io.to(serverRoomName).emit("players objects", players);

    message = `Last Scene Summary: [${summaryMsg}]
    
    ${storyFile[currentAct][currentScene].Header}

    Proactive Storytelling: Begin the scene with up to 100 words detailing the environment, 
    using the context from the last summary to enrich the setting and introduce new challenges. 
    Offer narrative cues embedded within these descriptions for potential player actions, 
    avoiding direct questions about their next move.

    Narration: "Involve aTreeFrog in scenarios requiring his input. Whenever aTreeFrog requests to do something, determine if the move should require a dice roll and initiate one if so. Prompt for d20 rolls with modifiers like stealth or perception as needed. Use 'roll a d20 with [modifier]' to instruct."

    Dice Rolls: After a roll, subtly weave the result into the story, affecting the narrative flow based on the outcome.

    Character Interaction: ${storyFile[currentAct][currentScene].CharacterInteraction}
    
    Story Advancement: ${storyFile[currentAct][currentScene].StoryAdvancement}

    Combat Preparation: Before any battle scenario, request an initiative roll to determine combat order.

    Dialogue: "Maintain first-person NPC dialogues for depth, ensuring aTreeFrog's interactions are immersive and contribute to the story. For example: Theo responds 'Well done. lets move on'."

    Guideline for Responses: "Keep all responses under 50 words to maintain engagement and pace. Ensure every part of the narrative builds towards the next scene, incorporating d20 rolls where applicable.

    Finding Items: Regardless of what aTreeFrog is searching for, if there's an opportunity to discover an item, prompt for a dice roll. Upon a successful roll, uniformly respond with "You have found an item" without specifying the item's nature. This ensures consistency and suspense, as the actual item will be determined externally. This approach maintains gameplay integrity and allows for seamless integration with your external item generation mechanism.
    Responses should be detailed yet concise, particularly at the start, to draw the player into the scene, 
    with subsequent interactions kept under 50 words for a dynamic and engaging role-playing experience. 
    The narrative should flow directly from the accumulated story, enhancing the sense of immersion and 
    adventure for aTreeFrog.
    
    "Please note: All responses must adhere to a strict maximum of 50 words to ensure concise and engaging storytelling. 
    This includes descriptions, character interactions, and narrative advancements. Each output, whether setting a scene, 
    the story, or during character exchanges, should be succinct, not exceeding the 50-word limit. Remember to prompt for 
    d20 roll with modifiers where appropriate, and conclude significant segments with 'END OF SCENE' once actions transition 
    the next narrative phase."`;

    const uniqueId = `user${"system"} -activity${activityCount} -${dateStamp} `;
    newSceneData = {
      role: "system",
      content: message,
      processed: false,
      id: uniqueId,
      mode: "All",
    };
    activityCount++;
    //send message to ai
    setTimeout(() => {
      chatMessages = [];
      chatMessages.push(newSceneData);
      settingUpNextScene = false;
    }, 1000);

    game.mode = "story";
    game.activityId = `game${serverRoomName}-activity${activityCount}-${dateStamp}`;

    for (let user in players) {
      if (players.hasOwnProperty(user) && players[user]?.type == "player") {
        players[user].settingUpNewScene = false;
        players[user].newSceneReady = false;
        players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${dateStamp}`;
      }
    }

    activityCount++;
    //ToDO: figure out if you need to emit game object too
    io.to(serverRoomName).emit("players objects", players);
  }

  async function getDominantColor(imagePath) {
    try {
      const dominantColor = await ColorThief.getColor(imagePath);
      // Convert RGB to RGBA (assuming 0.8 opacity)
      return `rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.8)`;
    } catch (error) {
      console.error("Error in getting dominant color:", error);
      return null;
    }
  }

  async function createDallEImage(prompt) {
    //const ogprompt = "a dungeons and dragons like book image of a rogue and a wizard about to enter a tavern on a dark snowy night";

    const data = {
      model: "dall-e-3",
      prompt: ("a dungeons and dragons like book image with the following specification: ", prompt),
      n: 1,
      size: "1024x1024",
      quality: "hd",
    };

    let image = await openai.images.generate(data);

    let shadowColor = await getDominantColor(image.data[0].url);

    console.log("shadowColor", shadowColor);

    let dallEObject = {
      imageUrl: image.data[0].url,
      shadowColor: shadowColor,
    };

    io.to(serverRoomName).emit("dall e image", dallEObject);

    console.log("image: ", image.data);
  }

  function selectRandomEquipment() {
    let equipmentScene = ["Health"]; // Default value
    if (storyFile && storyFile[currentAct] && storyFile[currentAct][currentScene]) {
      equipmentScene = storyFile[currentAct][currentScene].DiscoverableEquipment || ["Health"];
    }
    const randomIndex = Math.floor(Math.random() * equipmentScene.length);
    const randomKey = equipmentScene[randomIndex];
    return equipment[randomKey];
  }

  // function summarizeEquipmentFound(equipmentData) {

  //   let msg = ``;

  //   // no players received equipment, so don't say anything
  //   if (Object.keys(equipmentData).length < 1) {
  //     return;
  //   }

  //   Object.entries(equipmentData).forEach(([player, data]) => {

  //     msg += `${player} received ${data.quantity} ${data.item} `;

  //   });

  // }

  async function giveRandomEquipment(playerNames) {
    equipmentFoundData = {};
    let amount = 1;
    const activityDate = new Date().toISOString();

    if (typeof playerNames === "string") {
      //ai sent the users as a string with , seperated. instead of an array. So need to filter
      var namesArray = playerNames.split(",");
    } else {
      var namesArray = playerNames;
    }

    for (var i = 0; i < namesArray.length; i++) {
      let user = namesArray[i].trim();
      if (players.hasOwnProperty(user)) {
        const chosenEquipment = selectRandomEquipment();

        console.log("chosenEquipment", chosenEquipment);

        // always give a bunch of health potions
        if (chosenEquipment.name == "Health") {
          amount = 5;
        }

        equipmentFoundData[user] = {
          role: "assistant",
          message: `${user} received ${amount} ${chosenEquipment.name}`,
          clickableWord: chosenEquipment.name,
          iconPath: chosenEquipment.icon,
          mode: "All",
          type: "equipment",
          activityId: activityCount,
        };

        console.log("equipmentFoundData ", equipmentFoundData);

        if (players[user]?.equipment[chosenEquipment.name]) {
          // Increase the quantity of the existing equipment item
          players[user].equipment[chosenEquipment.name].quantity += amount;
        } else {
          // Add the equipment item with the needed quantity
          players[user].equipment[chosenEquipment.name] = {
            ...equipment[chosenEquipment],
            quantity: amount,
          };
        }

        players[user].activityId = `user${user}-game${serverRoomName}-activity${activityCount}-${activityDate} `;
      }
    }

    activityCount++;
    io.to(serverRoomName).emit("players objects", players);

    if (Object.keys(equipmentFoundData).length > 0) {
      io.to(serverRoomName).emit("equipment found", equipmentFoundData);
    }
  }

  //toDo: figure out when and how to give health potions
  async function giveHealthPotion(playerNames) {}

  async function checkPlayersState() {
    let anyPlayerRoll = false;
    let anyPlayerInitiativeRoll = false;
    let inInitiativeMode = false;
    let allPlayersReadyNewScene = true;
    let allPlayersLongRestReady = true;
    let activePlayers = false;
    Object.entries(players).forEach(async ([userName, playerData]) => {
      activePlayers = true;
      // check if any player is in iniative mode, means game is in iniative mode
      if (playerData?.type == "player" && playerData?.mode == "initiative") {
        inInitiativeMode = true;
      }

      if (playerData?.type == "player" && playerData?.mode == "dice" && playerData?.active && !playerData?.away) {
        console.log("player roll true: ", playerData);
        anyPlayerRoll = true;
      }

      if (playerData?.type == "player" && playerData?.mode == "initiative" && !playerData?.away && playerData?.battleMode?.initiativeRoll < 1) {
        anyPlayerInitiativeRoll = true;
      }

      if (
        playerData.type == "enemy" &&
        playerData.battleMode.yourTurn &&
        playerData.battleMode.attackRoll < 1 &&
        !playerData.battleMode.distanceMoved &&
        playerData.battleMode.usersTargeted.length < 1
      ) {
        await handleEnemyTurn(playerData); // call async function without awaiting so its non blocking.
      }

      // if a new scene is ready and all active players said there ready for the new scene, go to next scene.
      if ((settingUpNextScene && playerData?.type == "player" && !playerData.away && !playerData.newSceneReady) || !playerData.settingUpNewScene) {
        allPlayersReadyNewScene = false;
      }

      if (!playerData?.longRestRequest && playerData?.type == "player") {
        allPlayersLongRestReady = false;
      }
    });

    if (anyPlayerRoll || anyPlayerInitiativeRoll) {
      waitingForRolls = true;
    } else {
      waitingForRolls = false;
    }

    if (settingUpNextScene && allPlayersReadyNewScene) {
      settingUpNextScene = false; // so the player process every x second call doesnt call this function again when its still computing
      startOfNextScene(endOfSceneSummary);
    }

    //if everyone has done there initiative roll, put everyone in battle mode, and setup battle
    if (inInitiativeMode && !waitingForRolls) {
      console.log("going to battle mode");
      const activityDate = new Date().toISOString();
      Object.entries(players).forEach(([userName, playerData]) => {
        playerData.mode = "battle";
        //set a bunch of default states for the player
        defaultPlayersBattleInitMode(userName);
        playerData.activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${activityDate}`;
      });
      activityCount++;

      //create battle order
      assignBattleTurnOrder(players);

      console.log("battlemode players: ", players);
    }

    if (allPlayersLongRestReady && activePlayers) {
      Object.entries(players).forEach(([userName, playerData]) => {
        if (playerData.type == "player") {
          playerData.mode = "longRest";
          playerData.currentHealth = playerData.maxHealth;
          playerData.longRests += 1;
          playerData.longRestRequest = false;
          playerData.backgroundAudio = "/audio/bonfire.wav";
          playerData.backgroundAudioSecond = "/audio/night_forest.wav";
          playerData.activityId = `user${userName}-game${serverRoomName}-activity${activityCount}-${new Date().toISOString()}`;
        }
      });
      activityCount++;
      io.to(serverRoomName).emit("players objects", players);
      await runFunctionAfterDelay(() => startOfLongRest(), 7000);
    }

    console.log("update");

    io.to(serverRoomName).emit("players objects", players);
  }

  setInterval(checkPlayersState, 5000);

  setInterval(() => {
    responseSent.clear();
  }, 1000 * 60 * 30); // Clear every 30 mins, for example

  // wsServer.listen(3001, () => {
  //     console.log('WebSocket Server is running on http://localhost:3001');
  // });
});
