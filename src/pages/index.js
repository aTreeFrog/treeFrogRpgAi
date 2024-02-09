import { useState, useEffect, useRef, useContext } from "react";
import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import axios from 'axios';
import TypingAnimation from "../components/TypingAnimation";
import HexagonDice from "../components/HexagonDice"
import JitsiMeetComponent from '../components/JitsiMeetComponent';
import CharacterSheet from '../components/CharacterSheet';
import AudioInput from '../components/AudioInput'
import * as Tone from 'tone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHatWizard } from '@fortawesome/free-solid-svg-icons';
import SocketContext from '../context/SocketContext';
import CustomSelect from '../components/CustomSelect'; // Import the above created component
import TeamOrGmSelect from "../components/TeamOrGMSelect";
import MoveOnPopup from "../components/MoveOnPopup"
import BattleMap from '../components/BattleMap';
import { io } from "socket.io-client";
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import KnifeCutText from '../components/KnifeCutText'
import player from '../../lib/objects/player'
import { cloneDeep } from 'lodash';

const inter = Inter({ subsets: ['latin'] })

//let chatUrl = '/api/chat';
//let chatSocket = io('http://localhost:3000', { path: chatUrl });

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dalleImageUrl, setDalleImageUrl] = useState();
  const messageQueue = useRef([]); // Holds incoming messages
  const audioQueue = useRef(new Map()); // Holds incoming messages
  const [cancelButton, setCancelButton] = useState(0);
  const prevCancelButtonRef = useRef();
  // State to hold meeting details
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [api, setApi] = useState(null);
  const audio = useRef(false);
  const chatLogRef = useRef(chatLog);
  const tempBuffer = useRef('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const expectedSequence = useRef(0);
  const newAudio = useRef(null);
  const [inputTextHeight, setInputTextHeight] = useState(20);
  const textareaRef = useRef(null);
  const [isCustomTextOpen, setIsCustomTextOpen] = useState(false);
  const [customTextCells, setCustomTextCells] = useState(['I jump away', 'I check for magic', 'I sneak by', 'I yell Guards', '']);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [lastAudioInputSequence, setLastAudioInputSequence] = useState(100000) // some high value for init
  const [shouldStopAi, setShouldStopAi] = useState(false);
  const callSubmitFromAudio = useRef(false);
  const [audioInputData, setAudioInputData] = useState(false);
  const callSubmitFromDiceRolls = useRef(false);
  const [diceRollsInputData, setDiceRollsInputData] = useState('');
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
    }
  };
  const attackRollDiceStates = {
    d20: {
      value: [],
      isActive: true,
      isGlowActive: true,
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
    }
  };
  const [diceStates, setDiceStates] = useState(defaultDiceStates);
  const [diceRollId, setDiceRollId] = useState();
  const [pendingDiceUpdate, setPendingDiceUpdate] = useState(null);
  const [messageQueueTrigger, setMessageQueueTrigger] = useState(false); //to make useEffect check for dice rolls
  const latestDiceMsg = useRef(null);
  const [wizardHatEnable, setWizardHatEnable] = useState(false)
  const messageRefs = useRef([]);
  const [activeSkill, setActiveSkill] = useState("")
  const activityCount = useRef(0);
  const { chatSocket, userName } = useContext(SocketContext);
  const diceTone = useRef(null);
  const backgroundTone = useRef(null);
  const [diceSelectionOption, setDiceSelectionOption] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const speechTurnedOffMusic = useRef(false);
  const [customCellValue, setCustomCellValue] = useState('');
  const [teamGmOption, setTeamGmOption] = useState({ value: 'All', label: 'All' });
  const musicThreadControlActive = useRef(false);
  const [enableCellButton, setEnableCellButton] = useState(true);
  const [showMoveOnPopup, setShowMoveOnPopup] = useState(false);
  const storyModePopupWarning = "Are you sure?\n AI will wrap up scene and move onto next act.";
  const diceModePopupWarning = "Are you sure?\n AI will end dice mode and re-enable chatbox.";
  const battleModePopupWarning = "Are you sure?\n AI will wrap up battle and move onto next act.";
  const storyModeMoveOnButton = "Move On";
  const diceModeMoveOnButton = "End Roll";
  const battleModeMoveOnButton = "End Battle";
  const [popupText, setPopupText] = useState(storyModePopupWarning);
  const [moveOnButtonText, setMoveOnButtonText] = useState(storyModeMoveOnButton);
  const [usersInServer, setUsersInServer] = useState([]);
  const [players, setPlayers] = useState({ userName: player }); // init player dict
  const playersMsgActIds = useRef({});
  const [awayMode, setAwayMode] = useState(false);
  const iAmBack = useRef(false)
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isTimerPlaying, setIsTimerPlaying] = useState(false);
  const [updatingChatLog, setUpdatingChatLog] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isInitiativeImageLoaded, setIsInitiativeImageLoaded] = useState(false);
  const [shadowDomColor, setShadowDomColor] = useState();
  const [gameObject, setGameObject] = useState();
  const prevPlayersData = useRef();
  const speechAudioId = useRef({ messageId: null });
  const waitingForComplete = useRef(false);
  const [floatingValue, setFloatingValue] = useState(null);
  const [yourTurnText, setYourTurnText] = useState(false);
  const [showOverlayText, setShowOverlayText] = useState(false);
  const [activeTab, setActiveTab] = useState('Skills');
  const [selectedRow, setSelectedRow] = useState(null);
  const latestUserServer = useRef();
  const [loadBattlePlayerImages, setLoadBattlePlayerImages] = useState({});
  const [showPlayerName, setShowPlayerName] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);
  const [pingReady, setPingReady] = useState(false);
  const [isD20Spinning, setIsD20Spinning] = useState(false); // Initialize spinning state

  // Whenever chatLog updates, update the ref
  useEffect(() => {
    chatLogRef.current = chatLog;
    if (chatLogRef.current.length && chatLogRef.current[chatLogRef.current.length - 1].role === 'user') {
      scrollToBottom();
    }
  }, [chatLog]);

  const handleApiReady = (apiInstance) => {
    console.log("handleApiReady");
    setApi(apiInstance);
  }

  const disposeApi = () => {
    if (api) {
      console.log("api disconnecting");
      api.dispose();
    }
  }

  const resumeAudioContext = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }
  };

  // Ref to track if audio is currently playing
  const playNextAudio = () => {


    if (audioQueue.current.has(expectedSequence.current) && !audio.current) {
      resumeAudioContext();
      console.log("playNextAudio expectedSequence: ", expectedSequence.current)

      // Retrieve the object from the map
      const audioObj = audioQueue.current.get(expectedSequence.current);
      const audioSrc = audioObj.audio;  // Access the audio source
      const audioMessageId = audioObj.messageId; // If you need messageId

      audioQueue.current.delete(expectedSequence.current);


      // if brand new ai message came in, reset audioId inhibit to false
      // if user responds before ai speech is done, it will make inhibit true
      // and rest of that message will not output in audio form.
      if (audioMessageId != speechAudioId.current.messageId) {
        expectedSequence.current++;
        return;
      }

      //Tone.start();

      console.log("speechAudioId.current.messageId", speechAudioId.current.messageId);
      console.log("audioMessageId", audioMessageId);
      console.log("speechAudioId.current.inhibit", speechAudioId.current.inhibit);

      newAudio.current = new Tone.Player(audioSrc, () => {
        console.log("Audio is ready to play");
        volume: -10
        audio.current = true;
        // Start the audio manually after it's loaded and connected to effects
        newAudio.current.start();

      }).toDestination();

      //newAudio.current = new Audio(audioSrc);
      //newAudio.current.volume.value = 1;
      //newAudio.current.volume = 1;

      // Pitch shifting to lower the voice
      // Adjust the pitch shift value as needed
      // const pitchShift = new Tone.PitchShift({
      //   pitch: -1, // Try different values, like -8, -10, etc.
      //   windowSize: 0.0 // Experiment with this value
      // }).toDestination();
      // newAudio.current.connect(pitchShift);

      // const lowPassFilter = new Tone.Filter({
      //   frequency: 5000, // Hz, adjust as needed
      //   type: 'lowpass'
      // }).toDestination();
      // newAudio.current.connect(lowPassFilter);

      // Adding reverb for a more ominous effect
      const reverb = new Tone.Reverb({
        decay: 1, // Reverb decay time in seconds
        wet: 0.1  // Mix between the source and the reverb signal
      }).toDestination();
      // newAudio.current.connect(reverb);

      newAudio.current.onstop = () => {
        audio.current = false; // Clear the current audio
        expectedSequence.current++;
      };

      newAudio.current.onerror = (error) => {
        console.error("Error with audio playback", error);
        audio.current = false;
      };

      newAudio.current.onended = () => {
        newAudio.current.disconnect(); // Disconnect the player
        newAudio.current.dispose();
      };

    }
  };


  useEffect(() => {

    chatSocket.onopen = function (event) {
      console.log("Connection established!");
    };

    chatSocket.onerror = function (error) {
      console.error("WebSocket Error: ", error);
    };

    chatSocket.onclose = function (event) {
      console.log("Connection closed:", event);
    };

    // Emit event to server to create a meeting when component mounts
    chatSocket.emit('create-meeting');


    // Listen for the server's response
    chatSocket.once('meeting-created', (data) => {
      console.log("Meeting created:", data);
      setMeetingDetails(data); // Save the meeting details in state
    });

    chatSocket.on('latest user message', (data) => {
      //console.log('latest user message', data);
      chatSocket.emit("received user message", data);
      setUpdatingChatLog(true);
      setChatLog((prevChatLog) => [...prevChatLog, { "role": 'user', "message": data.content, "mode": data.mode }])
      setUpdatingChatLog(false);
    });

    const handleChatMessage = (msg) => {
      waitingForComplete.current = true;
      //console.log("handleChatMessage", msg);
      setCancelButton(1);
      setIsLoading(false);
      messageQueue.current.push(msg);
      tempBuffer.current += msg.message; // Modify tempBuffer ref

      // Process the buffer to extract complete sentences
      let lastIndex = 0;  // To track the last index of end-of-sentence punctuation
      for (let i = 0; i < tempBuffer.current.length; i++) {
        // Check for sentence termination (.,!,?)
        if (tempBuffer.current[i] === '.' || tempBuffer.current[i] === '!' || tempBuffer.current[i] === '?') {
          // Extract the sentence
          let sentence = tempBuffer.current.substring(lastIndex, i + 1).trim();
          if (sentence.length > 0) {
            textToSpeechCall(sentence, msg.messageId); ////////////////TURN BACK ON!!!!///////////////////////////////////////////
          }
          lastIndex = i + 1;  // Update the last index to the new position
        }
      }

      // Keep only the incomplete sentence part in the buffer
      tempBuffer.current = tempBuffer.current.substring(lastIndex);


    };


    const onChatComplete = (messageId) => {
      waitingForComplete.current = false;
      //setCancelButton(0); // Assuming setCancelButton is a state setter function
      console.log("onChatComplete");
      if (tempBuffer.current.length > 0) {
        textToSpeechCall(tempBuffer.current, messageId);
      }
      tempBuffer.current = '';

    };

    // Attach the event listener only once when the component mounts
    chatSocket.on('chat message', handleChatMessage);
    chatSocket.on('chat complete', onChatComplete);

    chatSocket.on('play audio', (recording) => {
      const audioSrc = `data:audio/mp3;base64,${recording.audio}`;
      console.log("play audio sequence: ", recording.sequence);
      audioQueue.current.set(recording.sequence, { audio: audioSrc, messageId: recording.messageId });
      //audioQueue.current.push(audioSrc);
      playNextAudio();
    });

    // chatSocket.on('dice roll', (data) => {
    //   console.log("dice roll received");

    //   if (messageQueue.current.length > 0) {
    //     setPendingDiceUpdate(data); // Save the data for later
    //     setDiceSelectionOption(null);
    //   } else {
    //     latestDiceMsg.current = data;
    //     updateDiceStates(data); // Update immediately if messageQueue is empty
    //   }

    // });

    // dice roll initializer message (server only sends when starting dice mode)
    chatSocket.on('players objects', (data) => {
      console.log("players objects received ", data);


      if (data[userName]) {
        latestUserServer.current = data[userName];
      }


      console.log("playersMsgActIds", playersMsgActIds);
      //ToDo: SEE IF WE CAN PREVENT UPDATING THE USESTATE OF PLAYERS IF ITS NOT UPDATED INFORMATION

      setPlayers(prevPlayers => {
        const updatedPlayers = cloneDeep(prevPlayers); // Deep copy the entire players object

        Object.entries(data).forEach(([playerName, playerData]) => {
          if (!playersMsgActIds.current[playerName]) {
            playersMsgActIds.current[playerName] = {};
            playersMsgActIds.current[playerName].activityId = "";
          }

          // For other players, always update
          if (playerName !== userName) {
            console.log(`Updating player: ${playerName}`); // Debugging: Confirm this runs
            updatedPlayers[playerName] = cloneDeep(playerData);
            playersMsgActIds.current[playerName].activityId = playerData?.activityId;

            // Debugging: Check the copied data
            console.log("clonedeep: ", updatedPlayers[playerName]);
          }

          // if user is in story mode, delete any enemy players in the players object
          if (updatedPlayers[userName]?.mode == "story" && updatedPlayers[playerName]?.type == "enemy") {
            delete updatedPlayers[playerName];
          }
          // For the current user, update only if the activityId is new
          else if ((playersMsgActIds.current[playerName]?.activityId != playerData?.activityId) && playerName === userName) {
            console.log("updated myself");
            updatedPlayers[playerName] = cloneDeep(playerData); // Deep copy playerData
          }
        });

        return updatedPlayers;
      });
    });

    //detect all users in the server
    chatSocket.on('connected users', (clients) => {
      console.log("connected users: ", clients);
      setUsersInServer(clients);
    });

    chatSocket.on('speech to text data', (data) => {

      //if empty audio comes in, for some reason response with a sentence. if so, dont call ai
      const processedText = data.text.trim().toLowerCase();
      const textWithoutWhitespace = processedText.replace(/[\s]+/g, ''); //removes whitespace

      //checks if data is thank you for watching or just a bunch of periods. If not, go on
      //i have a prompt in the api silence in the audio file which is what it outputs if theres no audio voice coming in
      if (!(processedText.toLowerCase().startsWith("thank you for watching") || /^\.+$/.test(textWithoutWhitespace)
        || processedText.toLowerCase().includes("silence in the audio file"))) {
        callSubmitFromAudio.current = true;
        setAudioInputData(data.text);
      }

      console.log("speech to text input data", data.text);

    });

    chatSocket.on('background music', (data) => {
      resumeAudioContext();
      PlayBackgroundAudio(data);

    });

    chatSocket.on('dall e image', (dallEObject) => {
      console.log("dall e image made, ", dallEObject.imageUrl);
      setDalleImageUrl(dallEObject.imageUrl);
      setShadowDomColor(dallEObject.shadowColor);

    });

    chatSocket.on('enter battle mode', (data) => {
      setGameObject(data);


    });

    readyChatAndAudio();

    // Cleanup listener when component unmounts
    return () => {
      chatSocket.off('meeting-created');
      chatSocket.off('latest user message');
      chatSocket.off('my user message');
      chatSocket.off('chat message', handleChatMessage);
      chatSocket.off('chat complete', onChatComplete);
      chatSocket.off('play audio');
      chatSocket.off('dice roll');
      chatSocket.off('speech to text data');
      chatSocket.off('background music');
      chatSocket.off('players objects');

    };

  }, [chatSocket]);

  useEffect(() => {


    if (!players) {
      return;
    }

    //check if already processed this message
    if (playersMsgActIds.current[userName]?.activityId == players[userName]?.activityId) {
      return;
    }

    console.log("my players ", players);
    // add to list of received messages
    playersMsgActIds.current[userName].activityId = players[userName]?.activityId;

    if (!players[userName]?.active) {
      cleanUpDiceStates();
    }

    if (players[userName]?.away) {
      setAwayMode(true);
    }

    if (players[userName]?.mode == "dice" && players[userName]?.active && !players[userName]?.away) {

      if (messageQueue.current.length > 0) {
        setPendingDiceUpdate(players[userName]); // Save the data for later
        setDiceSelectionOption(null);
      } else {
        latestDiceMsg.current = players[userName];
        updateDiceStates(players[userName]); // Update immediately if messageQueue is empty
      }

    } else if (players[userName]?.mode == "initiative" && players[userName]?.battleMode?.initiativeRoll < 1) {

      // load player images
      Object.values(players)
        .filter(player => player.userImageUrl)
        .forEach((_, index) => {
          setLoadBattlePlayerImages(prev => ({ ...prev, [index]: false }));
        });

      if (messageQueue.current.length > 0) {
        setPendingDiceUpdate(players[userName]); // Save the data for later
        setDiceSelectionOption(null);
      } else {
        latestDiceMsg.current = players[userName];
        updateDiceStates(players[userName]); // Update immediately if messageQueue is empty
      }

      if (players[userName]?.battleMode?.initiativeImageUrl) {
        setShadowDomColor(players[userName]?.battleMode?.initiativeImageShadow);
        const img = new window.Image();
        img.src = players[userName].battleMode.initiativeImageUrl;
        img.onload = () => setIsInitiativeImageLoaded(true);
      }

    } else if (players[userName]?.mode == "battle" && players[userName]?.battleMode?.yourTurn && players[userName]?.battleMode.usersTargeted.length > 0) {

      //roll attackRoll or attack amount dice if its your turn and you selected targets.
      if (players[userName]?.battleMode?.attackRoll < 1 && !players[userName]?.battleMode?.actionAttempted) {

        console.log("battle dice ready");
        latestDiceMsg.current = players[userName];
        updateDiceStates(players[userName]); // Update immediately if messageQueue is empty

        // attack dice rolls now
      } else if (players[userName]?.battleMode?.attackRollSucceeded && players[userName]?.battleMode?.actionAttempted && players[userName]?.battleMode?.damageDelt < 1) {

        console.log("action dice ready");
        latestDiceMsg.current = players[userName];
        updateDiceStates(players[userName]); // Update immediately if messageQueue is empty

      }

    }

    Object.entries(players).forEach(([playerName, playerData]) => {

      //if any player made a new ping position, set ping audio. 
      if ((playerData?.pingXPosition != null && playerData?.pingXPosition != prevPlayersData.current[playerName]?.pingXPosition)
        || (playerData?.pingYPosition != null && playerData.pingYPosition != prevPlayersData.current[playerName]?.pingYPosition)) {

        const pingTone = new Tone.Player({
          url: "/audio/player_ping.wav",
        }).toDestination();

        pingTone.autostart = true;

        pingTone.onended = () => {
          console.log('ping playback ended');
          pingTone.disconnect(); // Disconnect the player
        };

        pingTone.onerror = (error) => {
          console.error("Error with audio playback", error);
        };

      }

    });


    prevPlayersData.current = players;

  }, [players]);

  useEffect(() => {

    if (latestUserServer.current?.xPosition != players[userName]?.xPosition || latestUserServer.current?.yPosition != players[userName]?.yPosition) {

      console.log('player moved', players[userName]);

      chatSocket.emit('player moved', players[userName]);

    }

  }, [players[userName]?.xPosition, players[userName]?.yPosition]);

  useEffect(() => {

    if (latestUserServer.current?.pingXPosition != players[userName]?.pingXPosition || latestUserServer.current?.pingYPosition != players[userName]?.pingYPosition) {

      console.log('ping moved', players[userName]);

      chatSocket.emit('ping moved', players[userName]);

    }

  }, [players[userName]?.pingXPosition, players[userName]?.pingYPosition]);

  useEffect(() => {
    const serverUserNameTargeted = latestUserServer.current?.battleMode?.usersTargeted;
    const userNameTargeted = players[userName]?.battleMode?.usersTargeted;

    // Check if both are arrays
    if (Array.isArray(serverUserNameTargeted) && Array.isArray(userNameTargeted)) {
      // Check if the lengths are different or any element is different
      const arraysDiffer = serverUserNameTargeted.length !== userNameTargeted.length ||
        serverUserNameTargeted.some((user, index) => user !== userNameTargeted[index]);

      if (arraysDiffer) {
        console.log("users targeted: ", userNameTargeted);
        chatSocket.emit('users targeted', players[userName]);
      }
    }
  }, [players[userName]?.battleMode?.usersTargeted]);


  //makes the your turn text appear over the battle map for a little bit
  useEffect(() => {

    if (players[userName]?.battleMode?.yourTurn) {
      setActiveTab("Attacks/Spells");
      setTimeout(() => {
        setYourTurnText(true);
      }, 2000);
      setYourTurnText(true); // Use newValue directly
      setTimeout(() => {
        setYourTurnText(false);
      }, 5000);

    }
  }, [players[userName]?.battleMode?.yourTurn]);

  // makes the your turn text fade away
  useEffect(() => {
    if (yourTurnText) {
      setShowOverlayText(true);
    } else {
      // Start the fade-out transition
      const element = document.querySelector('.overlay-text');
      if (element) {
        element.classList.add('your-turn-fade');
      }
      // Use a timeout to match the CSS transition duration
      setTimeout(() => {
        setShowOverlayText(false);
      }, 2000); // 1000ms = 1s
    }
  }, [yourTurnText]);






  useEffect(() => {
    // Code to run when players[userName]?.backgroundAudio changes
    if (players[userName]?.backgroundAudio) {
      console.log("Background audio changed to:", players[userName].backgroundAudio);
      resumeAudioContext();
      PlayBackgroundAudio(players[userName].backgroundAudio);
    }
  }, [players[userName]?.backgroundAudio]);


  let lastMessage = [];
  // Function to process a single oldest message from the queue
  const processQueue = () => {
    if (messageQueue.current.length > 0 && !updatingChatLog) {
      let msg = messageQueue.current.shift(); // Get the oldest message
      //console.log("processQueue: ", msg);

      if (!msg.message) {
        return;
      }

      msg.message = msg.message?.replace(/undefined/g, '');

      setChatLog((prevChatLog) => {
        let updatedChatLog = [...prevChatLog];

        // Check if there's an existing entry with the same messageId
        let existingEntryIndex = updatedChatLog.findIndex(entry => entry.messageId === msg.messageId);

        if (existingEntryIndex !== -1) {
          // An existing entry is found
          let existingEntry = updatedChatLog[existingEntryIndex];

          // Check for duplicates and append message if it's not a duplicate
          if (!existingEntry.message.endsWith(msg.message)) {
            existingEntry.message += msg.message; // Append new content to existing message
          }
        } else if (msg.message) {

          // current messageId thats on chat log, audio can see if previous one 
          // was inhibited, and new message came in, don't inhibit it.
          speechAudioId.current.messageId = msg.messageId;

          // No existing entry, add a new one
          updatedChatLog.push({
            role: msg.role,
            message: msg.message,
            messageId: msg.messageId // Assuming msg has a messageId property
          });
        }

        lastMessage = updatedChatLog;
        return updatedChatLog;
      });

      setWizardHatEnable(true);
    } else {
      setWizardHatEnable(false);
    }
    setMessageQueueTrigger(prev => !prev);
  };



  const textToSpeechCall = async (text, messageId) => {

    const data = {
      message: text,
      messageId: messageId
    };
    // const data = {
    //   model: "tts-1",
    //   voice: "onyx",
    //   input: text,
    // };
    console.log("about to send emit for speech: ", text);
    // Convert the message object to a string and send it
    chatSocket.emit('audio message', data);

  };

  // play background music and handle multiple calls in tight sequence
  const PlayBackgroundAudio = async (data) => {
    if (musicThreadControlActive.current) {
      console.log("Music already getting prepped");
      return;
    }

    musicThreadControlActive.current = true;

    try {
      // Stop any existing background music
      if (backgroundTone.current && backgroundTone.current.state === "started") {
        await backgroundTone.current.stop();
        backgroundTone.current = null;
      }

      // Double-check if another thread has started the music
      if (musicThreadControlActive.current) {
        Tone.start();
        console.log("PlayBackgroundAudio data: ", data);
        await Tone.loaded(); // Ensure Tone.js is ready

        backgroundTone.current = new Tone.Player({
          url: data,
          loop: true
        }).toDestination();

        backgroundTone.current.volume.value = -10;
        backgroundTone.current.autostart = true;
      }
    } catch (error) {
      console.error("Error in playing audio", error);
    } finally {
      // Allow new music to be played after a short delay
      setTimeout(() => {
        musicThreadControlActive.current = false;
      }, 100); // Adjust this delay as needed
    }
  };


  const cancelButtonMonitor = () => {

    //if (audioQueue?.current.size > 0 || messageQueue.current.length > 0 || audio.current) {
    if (messageQueue.current.length > 0) {
      setCancelButton(prevValue => Math.min(prevValue + 2, 3));
    } else {
      setCancelButton(prevValue => Math.max(0, prevValue - 1));
    }
  }

  const handleKeyDown = (e) => {

    // dont allow enter key text submission if theres a pendingDiceUpdate meaning were gonna roll soon.
    if (!pendingDiceUpdate) {
      resumeAudioContext();
      // Check if the key pressed is 'Enter' and not holding the 'Shift' key (since that means new line)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent the default action (new line)
        handleSubmit({ preventDefault: () => { } }); // Call handleSubmit and pass a dummy event with preventDefault method
      }
    }
  };

  //adjust text input bar height based on amount of user input.
  const handleInputChange = (e) => {
    const textarea = e.target;
    const value = textarea.value;
    setInputValue(value); // existing state update

    if (typeof window !== 'undefined') {
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight, 10) || 20;
      const oldHeight = textarea.style.height;
      // Temporarily reset height to 'auto' to get the correct scrollHeight
      textarea.style.height = 'auto';
      const currentScrollHeight = textarea.scrollHeight;

      // Calculate the number of lines
      const numberOfLines = Math.ceil(currentScrollHeight / lineHeight);

      // Only update if the number of lines has changed or if the textarea is shrinking
      if (numberOfLines !== currentScrollHeight > parseInt(inputTextHeight, 10)) {
        textarea.style.height = `${currentScrollHeight}px`;
        setInputTextHeight(currentScrollHeight); // Update state with the new height

      } else {
        // If the new height is smaller, shrink the textarea
        textarea.style.height = `${Math.max(currentScrollHeight, lineHeight * numberOfLines)}px`;
        setInputTextHeight(Math.max(currentScrollHeight, lineHeight * numberOfLines));
      }

      // Restore the old height if the currentScrollHeight is larger than the content needs
      if (textarea.scrollHeight < textarea.clientHeight) {
        textarea.style.height = oldHeight;
      }
    }
  };

  useEffect(() => {
    // Set up the interval to process the message queue every x ms
    const intervalId = setInterval(() => {
      processQueue();
    }, 235);

    // Set up the interval to check all users in server room
    const checkAllUsers = setInterval(() => {
      chatSocket.emit('obtain all users');
    }, 5000);

    // Set up the interval to process audio queue every x ms
    const audioIntervalId = setInterval(() => {
      playNextAudio();
    }, 100);

    const cancelButtonIntervalId = setInterval(() => {
      cancelButtonMonitor();
    }, 200);
    return () => {
      clearInterval(intervalId); // Clear the interval on component unmount
      clearInterval(audioIntervalId); // Clear the interval on component unmount
      clearInterval(cancelButtonIntervalId);
      clearInterval(checkAllUsers);

    };
  }, []);

  // Ref for the scrollable div
  const scrollableDivRef = useRef(null);

  // Function to scroll to the bottom of the content
  const scrollToBottom = () => {
    const scrollableDiv = scrollableDivRef.current;
    if (scrollableDiv) {
      scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
    }
    setIsAtBottom(true);
    handleScroll();
  };

  useEffect(() => {

    if (scrollableDivRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableDivRef.current;

      const isUserAtBottom = () => {
        const tolerance = 70; // Adjust this value as needed
        return scrollHeight - scrollTop - clientHeight <= tolerance;
      };

      if (isUserAtBottom()) {
        // Scroll logic here
        scrollableDivRef.current.scrollTop = scrollHeight;
        setIsAtBottom(true);
      }
    }

  }, [chatLog]);

  useEffect(() => {
    ``
    // ComponentDidMount equivalent
    const handleLoad = () => {
      //checkScrolling(); // Call on window load
    };

    // Attach window load event
    window.addEventListener('load', handleLoad);

    // Attach scroll event to the div
    const scrollableDiv = scrollableDivRef.current;
    if (scrollableDiv) {
      //scrollableDiv.addEventListener('scroll', checkScrolling);
    }

    // Cleanup function for component unmount
    return () => {
      window.removeEventListener('load', handleLoad);
      if (scrollableDiv) {
        //scrollableDiv.removeEventListener('scroll', checkScrolling);
      }
    };
  }, []);

  const handleScroll = () => {
    const div = scrollableDivRef.current;
    if (div) {
      const tolerance = 30; // or whatever small number suits your situation
      const isScrolledToBottom = Math.abs(div.scrollHeight - div.scrollTop - div.clientHeight) < tolerance;
      setIsAtBottom(isScrolledToBottom);

    }
  };

  useEffect(() => {
    const div = scrollableDivRef.current;
    if (div) {
      div.addEventListener('scroll', handleScroll);
    }

    // Cleanup listener when component unmounts
    return () => {
      if (div) {
        div.removeEventListener('scroll', handleScroll);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleSubmit = (event) => {

    console.log("meeting details", meetingDetails?.meetingUrl);

    // Prevent the default form submission if an event is provided
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    //if there is a pending dice roll about to go down, don't allow ai cancellation
    // if (cancelButton !== 0 && !pendingDiceUpdate) {
    //   stopAi();
    //   setCancelButton(0);
    // } else {

    // Call the async function

    //see if data is coming from dice roll completion, audio message or normal text, or none at all.
    let chatMsgData = "";
    if (iAmBack.current) {
      iAmBack.current = false
      chatMsgData = "Game master, I am back in the game. Please continue to include me in the story again."
    } else if (diceRollsInputData.length > 0) {
      chatMsgData = diceRollsInputData;
      setDiceRollsInputData('');
      setDiceSelectionOption(null);
    } else if (diceSelectionOption) {

      const rollCompleteData = {
        User: userName,
        Total: 15, //placeholder until figure out how to handle diceSelectionOption.value
        D20Roll: 15, //placeholder until figure out how to handle diceSelectionOption.value
        Modifier: 2, /////put whatever the skill level is
        Skill: latestDiceMsg.current.Skill,
        Id: latestDiceMsg.current.activityId,
        Attack: selectedRow?.name,

      };
      //send data to the server (not sure yet how to use, prob for logs and others can see)
      chatSocket.emit('D20 Dice Roll Complete', rollCompleteData)
      chatMsgData = "I rolled a " + diceSelectionOption.value;
      // clean up all dice states
      cleanUpDiceStates();
    } else if (audioInputData.length > 0) {
      chatMsgData = audioInputData;
    } else if (customCellValue.length > 0) {
      chatMsgData = customCellValue;
    } else if (inputValue.length > 0) {
      chatMsgData = inputValue;
    }

    if (chatMsgData.length > 0) {

      //since you sent a message, auto say playing again
      if (players[userName]?.away) {
        chatSocket.emit('playing again', userName);
      }

      setAwayMode(false);
      iAmBack.current = false;

      //readyChatAndAudio();

      //sendImageMessage(chatMsgData);

      sendMessage(chatMsgData);

      setInputValue('');

      resetUserTextForm();

      setAudioInputData('');

      setCustomCellValue("");


    }


  }

  const cleanUpDiceStates = () => {
    latestDiceMsg.current = null;
    setPendingDiceUpdate(null);
    setDiceSelectionOption(null);
    setDiceRollsInputData('');
    setDiceStates(defaultDiceStates);
    setActiveSkill("");
  }

  const readyChatAndAudio = () => {
    chatSocket.emit('resume processing');
    audio.current = false;

    //messageQueue.current = [];
    chatSocket.emit('reset audio sequence');
    expectedSequence.current = 0;
    audioQueue.current = new Map();
    console.log("chatLog: ", chatLog);
    //chatSocket.emit("received user message", serverData);

    //setChatLog((prevChatLog) => [...prevChatLog, { type: 'user', message: inputMessage }])
  }

  const stopAi = () => {

    chatSocket.emit('cancel processing');
    messageQueue.current = [];
    audioQueue.current = new Map();
    setIsLoading(false);

    if (newAudio.current) {
      if (!newAudio.current.paused) {
        newAudio.current.stop();
        newAudio.current.currentTime = 0; // Reset only if it was playing
        newAudio.current = null;
      }
      audio.current = false;
    }
  }

  // this is called from the audioInput component if someone starts recording when ai is talking
  useEffect(() => {

    // only stop AI if theres no pending dice action about to go down. Otherwise prevent cancellations
    if (shouldStopAi && !pendingDiceUpdate) {
      // Call stopAi function here
      stopAi();
      setShouldStopAi(false); // Reset the state
    }
  }, [shouldStopAi]);

  //preload dalle image
  useEffect(() => {
    if (dalleImageUrl) {
      const img = new window.Image();
      img.src = dalleImageUrl;
      img.onload = () => setIsImageLoaded(true);
    }
  }, [dalleImageUrl])



  const resetUserTextForm = () => {
    // Reset the textarea after form submission
    if (textareaRef.current) {
      textareaRef.current.value = ''; // Clear the text
      textareaRef.current.style.height = 'auto'; // Reset the height to auto
      textareaRef.current.focus(); // Refocus on the textarea
    }

    setInputTextHeight(20);
  }

  const sendMessage = (message) => {

    console.log("about to send message: ", message);

    const uniqueId = `user${'aTreeFrog'}-activity${activityCount.current}-${new Date().toISOString()}`;
    let serverData = { "role": 'user', "content": message, "processed": false, "id": uniqueId, "mode": teamGmOption.value, "player": userName };
    activityCount.current++;
    chatSocket.emit('my user message', serverData);
    console.log("sent my user message", serverData);
    // Convert the message object to a string and send it
    //chatSocket.emit('chat message', message);
    setIsLoading(true);

  }

  const updateDiceStates = (data) => {

    console.log("updateDiceStates: ", data);

    latestDiceMsg.current = data;
    setDiceRollId(data.activityId);

    setDiceStates({
      ...diceStates, // Copy all existing dice states
      d20: {
        ...diceStates.d20,
        value: [],
        displayedValue: null,
        isActive: data.diceStates.d20.isActive,
        isGlowActive: data.diceStates.d20.isGlowActive,
        rolls: 0,
        rollsNeeded: data.diceStates.d20.rollsNeeded,
        inhibit: data.diceStates.d20.inhibit,
        advantage: data.diceStates.d20.advantage
      },
      d10: {
        ...diceStates.d10,
        value: [],
        displayedValue: null,
        isActive: data.diceStates.d10.isActive,
        isGlowActive: data.diceStates.d10.isGlowActive,
        rolls: 0,
        inhibit: data.diceStates.d10.inhibit,
        advantage: data.diceStates.d10.advantage
      },
      d8: {
        ...diceStates.d8,
        value: [],
        displayedValue: null,
        isActive: data.diceStates.d8.isActive,
        isGlowActive: data.diceStates.d8.isGlowActive,
        rolls: 0,
        inhibit: data.diceStates.d8.inhibit,
        advantage: data.diceStates.d8.advantage
      },
      d6: {
        ...diceStates.d6,
        value: [],
        displayedValue: null,
        isActive: data.diceStates.d6.isActive,
        isGlowActive: data.diceStates.d6.isGlowActive,
        rolls: 0,
        inhibit: data.diceStates.d6.inhibit,
        advantage: data.diceStates.d6.advantage
      },
      d4: {
        ...diceStates.d4,
        value: [],
        displayedValue: null,
        isActive: data.diceStates.d4.isActive,
        isGlowActive: data.diceStates.d4.isGlowActive,
        rolls: 0,
        inhibit: data.diceStates.d4.inhibit,
        advantage: data.diceStates.d4.advantage
      }
    });
    setActiveSkill(data.skill);

  }

  useEffect(() => {
    if (messageQueue.current.length == 0 && pendingDiceUpdate) {
      updateDiceStates(pendingDiceUpdate);
      setPendingDiceUpdate(false); // Clear the pending update
    }
  }, [messageQueueTrigger, pendingDiceUpdate]);

  //check if dice rolls are done, and send to server. then bring dice back to init state
  useEffect(() => {


    //control move on button text.  Use is glow active until better state figured out
    if (diceStates.d20.isGlowActive) {
      setPopupText(diceModePopupWarning);
      setMoveOnButtonText(diceModeMoveOnButton);
    } else {
      setPopupText(storyModePopupWarning);
      setMoveOnButtonText(storyModeMoveOnButton);
    }

    if (!pendingDiceUpdate && latestDiceMsg.current) {

      console.log("dice use effect d20 data: ", diceStates.d20);

      // //if d20 dice is active, check and see if actions completed
      // if (latestDiceMsg.current.diceStates.d20.isActive) {
      //   if (latestDiceMsg.current.diceStates.d20.Advantage) {
      //     if (diceStates.d20.rolls > 1) {
      //       d20Sum = max(diceStates.d20.value[0], diceStates.d20.value[1]);
      //       actionsComplete = true;
      //     }
      //   } else if (latestDiceMsg.current.diceStates.d20.Disadvantage) {
      //     if (diceStates.d20.rolls > 1) {
      //       d20Sum = min(diceStates.d20.value[0], diceStates.d20.value[1]);
      //       actionsComplete = true;
      //     }
      //   } else if (diceStates.d20.rolls > 0) {
      //     d20Sum = diceStates.d20.value[0];
      //     actionsComplete = true;
      //   }

      // }

      let actionsComplete = false; // Do not assume completion initially
      let totalDiceSum = 0; // Variable to store the total sum of all dice values
      let activeDiceFound = false; // Flag to track if any dice is active

      // Iterate through each dice state
      for (const [diceType, playerDiceRequests] of Object.entries(latestDiceMsg.current.diceStates)) {
        console.log("diceType: ", diceType);

        if (playerDiceRequests.isGlowActive) {
          activeDiceFound = true; // Mark that we have found at least one active dice
          const currentDiceState = diceStates[diceType]; // Correctly access the dice state

          console.log("currentDiceState ", currentDiceState);
          // Check if the dice has rolled the needed amount
          if (currentDiceState.rolls < playerDiceRequests.rollsNeeded) {
            actionsComplete = false; // Not all actions are complete
            break; // Exit the loop early since we found an incomplete action
          } else {
            // Calculate and add to the total sum of the dice values up to rollsNeeded
            for (let i = 0; i < playerDiceRequests.rollsNeeded; i++) {
              totalDiceSum += currentDiceState.value[i];
            }
          }
        }
      }

      // Only if active dice were found, check if all actions are completed
      if (activeDiceFound && !actionsComplete) {
        actionsComplete = true; // All active dice have completed their rolls
      }

      if (actionsComplete) {

        // this was a d20 roll so check for high roll and play music
        if (latestDiceMsg.current.diceStates.d20.rolls > 0 && totalDiceSum > 14) {

          resumeAudioContext();
          diceTone.current = new Tone.Player({
            url: "/audio/level_up_sound_effect.mp3",
          }).toDestination();

          diceTone.current.autostart = true;

          diceTone.current.onended = () => {
            console.log('Playback ended');
            diceTone.current.disconnect(); // Disconnect the player
          };


        }

        const rollCompleteData = {
          User: userName,
          Total: totalDiceSum,
          Modifier: 2, /////put whatever the skill level is
          Skill: latestDiceMsg.current.Skill,
          Id: latestDiceMsg.current.activityId
        };
        //send data to the server (not sure yet how to use, prob for logs and others can see)
        chatSocket.emit('D20 Dice Roll Complete', rollCompleteData)
        //Need to send some kind of animation above the dice for being done showing values

        //put outcome to chatbox
        //delay some time to give people chance to see there stuff, and for visuals on UI
        latestDiceMsg.current = null;
        setDiceStates(prevState => ({
          ...prevState,
          d20: {
            ...prevState.d20,
            inhibit: false,
            isGlowActive: false
          },
          d10: {
            ...prevState.d10,
            inhibit: false,
            isGlowActive: false
          },
          d8: {
            ...prevState.d8,
            inhibit: false,
            isGlowActive: false
          },
          d6: {
            ...prevState.d6,
            inhibit: false,
            isGlowActive: false
          },
          d4: {
            ...prevState.d4,
            inhibit: false,
            isGlowActive: false
          }
        }));
        setTimeout(() => {
          callSubmitFromDiceRolls.current = true;
          setDiceRollsInputData(`I rolled a ${totalDiceSum} +2 modifier`);
          setDiceStates(defaultDiceStates);
          setActiveSkill("");
          console.log("the end");
        }, 3000);

      }
    }
  }, [diceStates]);

  useEffect(() => {
    if (callSubmitFromDiceRolls.current && diceRollsInputData.length > 0) {
      console.log("submit from dice");
      callSubmitFromDiceRolls.current = false
      handleSubmit({ preventDefault: () => { } }); //calls using dummy function

    }
  }, [diceRollsInputData]);

  //if audio to text input received, send the data to the handleSubmit but need 
  //to first ensure inputData got updated. So calling it this way. 
  useEffect(() => {
    if (callSubmitFromAudio.current) {
      callSubmitFromAudio.current = false
      handleSubmit({ preventDefault: () => { } }); //calls using dummy function
      // Optionally reset the flag after calling the function

    }
  }, [audioInputData]);

  // const sendImageMessage = (message) => {
  //   const url = '/api/image';
  //   const data = {
  //     model: "dall-e-3",
  //     prompt: "a dungeons and dragons like book image of a rogue and a wizard about to enter a tavern on a dark snowy night",
  //     n: 1,
  //     size: "1024x1024",
  //     quality: "hd",
  //   };

  //   axios.post(url, data).then((response) => {
  //     setDalleImageUrl(response.data.data[0].url);
  //     console.log("dalleImageUrl", dalleImageUrl);
  //   }).catch((error) => {
  //     console.log(error);
  //   })
  // }

  const newTextEnterKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Prevent the default action to avoid form submission or anything else
      event.target.blur();     // Remove focus from the input
    }
  };

  // Handles text input and converts input to a text element
  const handleBlur = (index, value) => {
    const newCells = [...customTextCells];
    // If all cells are empty, ensure there's one empty cell
    if (newCells.every((cell) => cell === '')) {
      newCells.push('');
    }
    newCells[index] = value;

    if (index === customTextCells.length - 1 && value && customTextCells[customTextCells.length - 1] !== '') {
      newCells.push('');  // Add a new empty cell at the end

    } else if (index === customTextCells.length - 1 && !value) {
      // If the last cell is emptied, remove extra empty cells
      while (newCells.length > 1 && newCells[newCells.length - 2] === '') {
        newCells.pop();
      }
    }

    // ensures a new empty cell appears at the end even if last cell was modified
    if (index === customTextCells.length - 1 && value && customTextCells[customTextCells.length - 1] == '') {
      newCells.push('');
    }

    setCustomTextCells(newCells);

  };

  // Handles clicking on the cell
  const handleCellClick = (content) => {

    if (!enableCellButton) return;

    setEnableCellButton(false);

    console.log(`Cell clicked with content: ${content}`);
    setCustomCellValue(content);

    // Re-enable the button after 2 seconds
    setTimeout(() => {
      setEnableCellButton(true);
    }, 2000);

  };

  useEffect(() => {
    if (customCellValue.length > 0) {
      handleSubmit({ preventDefault: () => { } }); //calls using dummy function
    }
  }, [customCellValue]);

  // Deletes the content of the cell, making it an input again
  const deleteCellContent = (index) => {
    const newCells = [...customTextCells];
    newCells.splice(index, 1);  // Remove the cell content at the specific index
    // Ensure the last cell is always an empty input
    if (newCells.length === 0 || newCells[newCells.length - 1] !== '') {
      newCells.push('');  // Add an empty cell if there isn't one already
    } // Ensure there's always an empty input cell at the end
    setCustomTextCells(newCells);
  };

  //for the ICON that follows the text. only add it to last bot message
  const lastBotMessageIndex = chatLog.map(e => e.role).lastIndexOf('assistant');

  const handleDropdownChange = (option) => {

    console.log("handleDropdownChange ", option);

    setDiceSelectionOption(option);
  };

  const options = [
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
    { value: '20 + 2 Modifier', label: '20 + 2 Modifier' },
  ];

  const handleTeamGmChange = (option) => {

    console.log("handleTeamGmChange ", option);
    setTeamGmOption(option);
  };

  const teamGmOptionsList = [
    { value: 'All', label: 'All' },
    { value: 'Team', label: 'Team' },
  ];

  // if speech to text panel opened or closed, close or resume background audio. 
  // But only resume audio if this panel was the thing that paused it
  useEffect(() => {
    let currentVolumeDb = 0;
    console.log("made it to speech recording");
    if (isRecording && backgroundTone?.current?.state === "started") {
      console.log("speech recording hi");
      currentVolumeDb = backgroundTone.current.volume.value;
      backgroundTone.current.volume.value = -40;
      speechTurnedOffMusic.current = true;

    } else if (!isRecording && speechTurnedOffMusic.current) {
      speechTurnedOffMusic.current = false;
      backgroundTone.current.volume.value = currentVolumeDb;
    }
  }, [isRecording]);

  useEffect(() => {

    if (players && players[userName]?.timers.enabled) {
      setIsTimerVisible(true);
    } else {
      setIsTimerVisible(false);
    }

  }, [players]);

  const MoveOnClick = () => {
    setShowMoveOnPopup(prevState => !prevState);

  };

  const MoveOnClose = () => {
    setShowMoveOnPopup(false);
  };

  const MoveOnConfirm = () => {
    // Perform the action
    console.log('Confirmed!');

    if (players[userName]?.mode == "dice") {
      const rollCompleteData = {
        User: userName,
        Total: 15, //placeholder until figure out how to handle diceSelectionOption.value
        D20Roll: 15, //placeholder until figure out how to handle diceSelectionOption.value
        Modifier: 2, /////put whatever the skill level is
        Skill: latestDiceMsg.current.Skill,
        Id: latestDiceMsg.current.activityId
      };
      //send data to the server (not sure yet how to use, prob for logs and others can see)
      chatSocket.emit('D20 Dice Roll Complete', rollCompleteData);

    } else if (players[userName]?.mode == "story") {
      chatSocket.emit('story move on');
    }

    cleanUpDiceStates();
    setShowMoveOnPopup(false);
  };

  const handleImBack = () => {
    chatSocket.emit('playing again', userName);
    iAmBack.current = true;
    setAwayMode(false);
    handleSubmit({ preventDefault: () => { } });
  };

  const onTimerComplete = () => {
    setIsTimerVisible(false);
    return [false, 0]; // Stops the timer
  };

  // Define dynamic box shadow style
  const boxShadowStyle = {
    animation: `boxShadowGlowAnimation 6s ease-in-out infinite`,
    boxShadow: `0 0 40px ${shadowDomColor}`, // Initial shadow
    // Other styles...
  };

  // Define keyframes as a style tag
  const keyframesStyle = `
        @keyframes boxShadowGlowAnimation {
            0%, 100% {
                box-shadow: 0 0 40px ${shadowDomColor};
            }
            50% {
                box-shadow: 0 0 60px ${shadowDomColor};
            }
        }
    `;


  // Update the loadedplayerImages state when an image is loaded or fails to load
  const handlePlayerImageLoaded = (index) => {
    setLoadBattlePlayerImages((prev) => ({ ...prev, [index]: true }));
  };

  // Check if all player images are loaded
  const allPlayerImagesLoaded = Object.values(loadBattlePlayerImages).length === Object.values(players).filter(player => player.userImageUrl).length && Object.values(loadBattlePlayerImages).every(status => status);

  const handleMouseOver = (player) => {
    console.log("handleMouseOver ", player);
    setShowPlayerName(prevState => ({
      ...prevState,
      [player.name]: true
    }));
  };

  const handleMouseOut = (player) => {
    setShowPlayerName(prevState => ({
      ...prevState,
      [player.name]: false
    }));
  };

  useEffect(() => {

    if ((!isAudioOpen || isCustomTextOpen) && (mediaRecorder && mediaRecorder.state === "recording")) {
      audioChunks.current = [];
      mediaRecorder.stop();
    }

  }, [isAudioOpen, isCustomTextOpen]);

  return (
    <div className="flex justify-center items-start h-screen bg-gray-900 overflow-hidden">
      {/* Left Box */}
      <div className="flex-1 max-w-[400px] border border-white">
        {awayMode ? (
          <div className="flex items-center justify-center h-screen bg-purple-500 bg-opacity-30 backdrop-blur ">
            <div className="text-center">
              <p className="text-white text-2xl font-semibold mb-10">You stepped away</p>
              <button
                onClick={handleImBack}
                className="bg-white text-purple-500 text-xl font-semibold py-2 px-4 rounded"
              >
                I'm back
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-screen justify-between"> {/* Adjusted for spacing */}
            <div>
              <h1 className="break-words bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center py-3 font-bold text-3xl md:text-4xl">Character</h1>
              <div>
                <CharacterSheet name="Aragorn" race="Human" characterClass="Ranger" level="5" activeSkill={activeSkill} activeTab={activeTab} setActiveTab={setActiveTab} player={players[userName]} selectedRow={selectedRow} setSelectedRow={setSelectedRow} isD20Spinning={isD20Spinning} />
              </div>
            </div>
            {/* Toggle Meeting Panel Button */}
            <div className="flex">
              <button
                onClick={() => {
                  // First, check if the panel is currently open
                  // if (isPanelOpen) {
                  //   // If the panel is open, it means we're about to close it,
                  //   // so call the function to end the Jitsi meeting.
                  //   disposeApi();  // Make sure this function properly disposes of your Jitsi meeting
                  // }
                  // Next, toggle the panel's open state regardless of the current state.
                  // If it was open, this will close it, and vice versa.
                  setIsPanelOpen(prevState => !prevState);
                }}
                className="absolute bottom-0 left-20 mb-10 ml-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold focus:outline-none transition-colors duration-300 py-2 px-4 rounded"
              >
                {isPanelOpen ? 'Hide Party' : 'Open Party'}
              </button>
              <button
                onClick={MoveOnClick}
                className="absolute bottom-0 left-60 mb-10 ml-4 bg-purple-600 hover:bg-red-500 text-white font-semibold focus:outline-none transition-colors duration-300 py-2 px-4 rounded"
              >
                {moveOnButtonText}
              </button>
              {showMoveOnPopup && (
                <MoveOnPopup popupText={popupText} MoveOnClose={MoveOnClose} MoveOnConfirm={MoveOnConfirm} />
              )}
            </div>
            {/* Floating Jitsi Meeting Panel */}
            <div className={`absolute bottom-0 left-0 mb-20 ml-20 p-3 bg-black border border-gray-200 rounded-lg shadow-lg max-w-[250px] ${isPanelOpen ? 'visible w-96 h-[30rem]' : 'invisible h-0 overflow-hidden'}`}>
              <JitsiMeetComponent meetingRoom={meetingDetails?.roomName} onApiReady={handleApiReady} />
            </div>
          </div>
        )}
      </div>
      {/* Center Box (Original Content) */}
      <div className="flex-1 max-w-[700px] border border-white">
        <div className="flex flex-col h-screen justify-start">
          <h1 className="break-words bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center py-3 font-bold text-3xl md:text-4xl">Story</h1>
          {/* Conditional DALL·E Image */}
          {isImageLoaded && (players[userName]?.mode == "story" || players[userName]?.mode == "dice") && (
            <img
              src={dalleImageUrl}
              alt="DALL·E Generated"
              className="w-4/5 md:w-3/4 h-auto mx-auto rounded-lg shadow-lg md:mt-12"
              style={boxShadowStyle}
            />
          )}
          {isInitiativeImageLoaded && players[userName]?.mode == "initiative" && !pendingDiceUpdate && (
            <div>
              <img
                src={players[userName].battleMode.initiativeImageUrl}
                alt="DALL·E Generated"
                className="h-auto mx-auto rounded-lg relative w-4/5 md:w-3/4 mx-auto shadow-lg md:mt-12"
                style={boxShadowStyle}
              />
              <div className="text-center mt-6">
                <span className="whitespace-nowrap backdrop-blur-sm mr-2 rounded text-purple-700 font-semibold shiny-text blur-text md:text-3xl">Roll for Initiative</span>
              </div>
            </div>
          )}
          {players[userName]?.mode == "battle" && (
            <>
              <BattleMap
                gridSpacing={45} players={players} setPlayers={setPlayers} userName={userName} selectedRow={selectedRow} setSelectedRow={setSelectedRow} showPlayerName={showPlayerName} setShowPlayerName={setShowPlayerName} pingReady={pingReady} setPingReady={setPingReady}
                className="w-4/5 md:w-3/4 h-auto mx-auto rounded-lg shadow-lg md: mt-4 ml-6"
              />
              {showOverlayText && (
                <div className="overlay-text fade-in">
                  Your Turn
                </div>
              )}
            </>
          )}
          {/* Row of Player Images in Battle Mode */}
          {players[userName]?.mode == "battle" && !floatingValue && (
            <div className={`flex justify-center mt-4 mr-8 ${!allPlayerImagesLoaded ? 'invisible' : ''}`}>
              {Object.values(players)
                .sort((a, b) => a.battleMode?.turnOrder - b.battleMode?.turnOrder)
                .filter(player => player.userImageUrl)
                .map((player, index) => (
                  <div key={index} className="player-container relative flex flex-col items-center mx-1"> {/* Adjusted line */}
                    <div className={`w-10 h-10 rounded-full overflow-hidden ${player.battleMode.targeted ? 'player-glow-active' : ''}`}>
                      <img
                        src={player.userImageUrl}
                        alt={player.name}
                        onLoad={() => handlePlayerImageLoaded(index)}
                        className={`w-full h-full object-cover rounded-full ${(player.name === userName && player.battleMode.yourTurn) ? 'userpicture-effect' : ''}`}
                        style={{
                          border: (player.name === userName && player.battleMode.yourTurn) ? '2px solid yellow' :
                            player.battleMode.yourTurn ? '2px solid white' : 'none',
                          opacity: loadBattlePlayerImages[index] ? '1' : '0',
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundImage: `linear-gradient(to top, rgba(255, 0, 0, 0.5) ${100 - (100 * player.currentHealth / player.maxHealth)}%, transparent ${100 - (100 * player.currentHealth / player.maxHealth)}%)`,
                        zIndex: 2,
                      }}
                        onMouseOver={() => handleMouseOver(player)}
                        onMouseOut={() => handleMouseOut(player)}>

                      </div>
                    </div>
                    {showPlayerName[player.name] === true && (
                      <div
                        className="player-name-tooltip absolute bottom-full mb-2"
                        style={{ backgroundColor: player.type === "enemy" ? 'red' : 'green' }} > {/* Adjusted line for tooltip */}
                        {player.name}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
        <div className="container mx-auto flex flex-col items-center justify-start">
          {/* Apply negative margin or adjust padding as needed */}
          <div className="absolute left-23 bottom-10">
            {isTimerVisible && (
              <div className={`${pendingDiceUpdate ? 'timer-hidden' : ''} absolute bottom text-white text-xl font-semibold ml-[-302px] mb-[-50px]`}>
                <CountdownCircleTimer
                  isPlaying={isTimerVisible}
                  duration={players[userName].timers.duration}
                  size={50}
                  strokeWidth={4} // Adjust stroke width as needed
                  colors={[
                    ['#000000', 0.33],
                    ['#F7B801', 0.33],
                    ['#A30000', 0.33],
                  ]}
                  onComplete={onTimerComplete}
                >
                  {({ remainingTime }) => remainingTime}
                </CountdownCircleTimer>
              </div>
            )}
            <div className="text-white text-2xl font-semibold  ml-[-35px]">
              <HexagonDice diceStates={diceStates} setDiceStates={setDiceStates} floatingValue={floatingValue} setFloatingValue={setFloatingValue} isD20Spinning={isD20Spinning} setIsD20Spinning={setIsD20Spinning} />
            </div>
          </div>
        </div>
      </div>
      {/* Right Box */}
      <div className="flex-1 max-w-[450px] bg-gray-800 p-4 relative flex flex-col h-[100vh] border border-white">
        {/* Sticky Header */}
        <h1 className="sticky top-0 z-10 break-words bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center pt-0 pb-5 font-semibold focus:outline-none text-3xl md:text-4xl">Game Master</h1>
        {/* Scrollable Content */}
        <div ref={scrollableDivRef} className="overflow-y-auto scrollable-container flex-grow" id="scrollableDiv">
          <div className="flex flex-col space-y-4 p-6">
            {chatLog.map((message, index) => (
              <div key={`${message.messageId}-${index}`} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Conditional rendering of the user's name */}
                {message.role === 'user' && (usersInServer.length > 1) && (
                  <div className="text-sm mb-1 mr-1 text-white">
                    {userName}
                  </div>
                )}
                <div className={`${message.role === 'user' && message.mode === 'All' ? 'bg-purple-500' : message.role === 'user' && message.mode === 'Team' ? 'bg-yellow-700' : 'bg-gray-800'} rounded-lg p-2 text-white max-w-sm`}>
                  {message.message}
                  {wizardHatEnable && message.role === 'assistant' && index === lastBotMessageIndex &&
                    <span className="wizard-hat inline-block ml-1">
                      <FontAwesomeIcon icon={faHatWizard} />
                    </span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Fixed Send Message Form or other bottom content */}
        <div>
          {players[userName]?.mode == "battle" && !players[userName]?.battleMode?.yourTurn && (
            <div className="flex-grow flex justify-center items-center text-red-500 font-semibold text-xs -translate-x-3 translate-y-4">
              Not your turn, only team sees your message
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-auto p-6 flex items-center">
            <button type="button" style={{ minWidth: '29px', width: '29px', height: '29px', borderRadius: '50%', opacity: '0.7', left: '2px', marginLeft: '-20px', zIndex: 3 }}
              className=" mt-2 flex items-center justify-center bg-gray-700 text-white font-semibold "
              onClick={() => {
                setIsCustomTextOpen(prevState => !prevState);
                setIsAudioOpen(false); {/* probably have some audio clean up to do too */ }
                {
                  isCustomTextOpen && (
                    <div className="-mt-3 text-white bg-gray-800 p-4 rounded-lg border border-gray-500">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Render cells */}
                        {customTextCells.map((content, index) => (
                          content ?
                            // Cell with text and cancel area
                            <div key={index} className="flex items-center gap-1">
                              {/* Cell with text */}
                              <button className="flex-grow p-2 rounded text-white bg-gray-600  hover:font-semibold hover:bg-gray-500  focus:outline-none transition-colors duration-300"
                                disabled={diceStates.d20.isGlowActive}
                                onClick={() => handleCellClick(content)}
                              >
                                {content}
                              </button>
                              {/* Cancel button */}
                              <button className="text-red-500 p-2 rounded" onClick={() => deleteCellContent(index)}>X</button>
                            </div>
                            :
                            // Input cell
                            <input
                              key={index}
                              type="text"
                              placeholder="Type here..."
                              onKeyDown={newTextEnterKeyDown}
                              onBlur={(e) => handleBlur(index, e.target.value)}
                              className="p-2 bg-gray-700 rounded text-white maxWidth:10px"

                            />
                        ))}
                      </div>
                    </div>
                  )
                }
              }}>
              <span style={{ paddingBottom: '4px' }}>+</span>
            </button>
            <div className="ml-2 flex-grow flex items-center rounded-lg border border-gray-700 bg-gray-800" style={{ position: 'relative', minWidth: '330px' }}>
              {/* Arrow Button at the Bottom Middle, initially hidden */}
              <button
                type="button"
                id="scrollArrow"
                className={`${isAtBottom ? 'hidden' : ''} absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full`}
                style={{ bottom: `${inputTextHeight + 35}px` }}
                onClick={scrollToBottom}
              >
                ↓
              </button>
              {/* Make sure the input container can grow and the button stays aligned */}
              <div className="flex items-center" style={{ position: 'relative', zIndex: 2, flexGrow: 1 }}>
                {diceStates.d20.isGlowActive ?
                  <>
                    <textarea
                      className="bg-transparent text-white focus:outline-none"
                      placeholder=""
                      value={"I rolled a"}
                      readOnly
                      style={{ maxWidth: '70px', minHeight: '10px', marginRight: '1px', marginLeft: '15px' }} // Set a fixed width
                      rows={1}
                      ref={textareaRef}
                    ></textarea>
                    <CustomSelect
                      options={options}
                      value={diceSelectionOption}
                      onChange={handleDropdownChange}
                      submittingDice={diceStates.d20.isGlowActive}
                    />

                  </>
                  :
                  <>
                    <TeamOrGmSelect
                      options={teamGmOptionsList}
                      value={teamGmOption}
                      onChange={handleTeamGmChange}
                    />
                    <textarea
                      className="w-full px-4 py-2 bg-transparent text-white focus:outline-none"
                      placeholder="Type your message..."
                      value={inputValue}
                      onKeyDown={handleKeyDown}
                      onChange={(e) => handleInputChange(e)}
                      style={{ minHeight: '10px' }}
                      rows={1}
                      ref={textareaRef}
                      disabled={pendingDiceUpdate}
                    ></textarea>
                  </>
                }
              </div>
              <button type="submit" style={{ position: 'relative', zIndex: 1 }}
                className={`${(!diceStates.d20.isGlowActive || (diceStates.d20.isGlowActive && diceSelectionOption))
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-grey-700 hover:bg-grey-700'
                  } rounded-lg px-4 py-2 text-white font-semibold focus:outline-none transition-colors duration-300`}
                disabled={(diceStates.d20.isGlowActive && !diceSelectionOption) || pendingDiceUpdate}>
                {messageQueue.current.length > 0 ? '▮▮' : 'Send'}
              </button>
            </div>
            <button type="button" style={{ width: '29px', height: '29px', borderRadius: '50%', opacity: '0.7', left: '20px', marginLeft: '10px', marginRight: '-15px', zIndex: 3 }}
              className="bg-gray-700 text-white font-semibold rounded-full w-10 h-10 flex items-center justify-center p-2"
              onClick={() => {
                setIsAudioOpen(prevState => !prevState);
                setIsCustomTextOpen(false);
              }}
            >
              <div className="w-1 bg-white h-2"></div>
              <div className="w-1 bg-white h-3 mx-0.5"></div>
              <div className="w-1 bg-white h-2.5"></div>
            </button>
          </form>
        </div>
        {players[userName]?.mode == "battle" && (
          <div className="-mt-3 text-white bg-gray-800 p-4 rounded-lg border border-gray-500">
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`${players[userName]?.battleMode?.yourTurn ? "endturn-gradient" : "bg-gray-900 font-semibold rounded py-2 px-4 text-white"
                  } disabled:opacity-50`}
                disabled={!players[userName]?.battleMode?.yourTurn}
              >
                End Turn
              </button>

              <button
                className={`${pingReady ? 'bg-red-500 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-semibold focus:outline-none transition-colors duration-300 py-2 px-4 rounded`}
                onClick={() => {
                  setPingReady(prevState => !prevState);
                }}
              >
                {pingReady ? 'Stop Ping' : 'Ping'}
              </button>
            </div>
          </div>
        )}
        {
          isCustomTextOpen && (
            <div className="-mt-3 text-white bg-gray-800 p-4 rounded-lg border border-gray-500">
              <div className="grid grid-cols-3 gap-2 all-cells">
                {/* Render cells */}
                {customTextCells.map((content, index) => (
                  content ?
                    // Cell with text and cancel area
                    <div key={index} className="flex items-center gap-1">
                      {/* Cell with text */}
                      <button className="all-cells flex-grow p-2 rounded text-white bg-gray-600  hover:font-semibold hover:bg-gray-500  focus:outline-none transition-colors duration-300"
                        disabled={diceStates.d20.isGlowActive}
                        onClick={() => handleCellClick(content)}
                      >
                        {content}
                      </button>
                      {/* Cancel button */}
                      <button className=" all-cells text-red-500 p-2 rounded" onClick={() => deleteCellContent(index)}>X</button>
                    </div>
                    :
                    // Input cell
                    <input
                      key={index}
                      type="text"
                      placeholder="Type here..."
                      maxLength={50}
                      onKeyDown={newTextEnterKeyDown}
                      onBlur={(e) => handleBlur(index, e.target.value)}
                      className="word-cell all-cells p-2 bg-gray-700 rounded text-white"
                    />
                ))}
              </div>
            </div>
          )
        }
        {
          isAudioOpen && (
            <div>
              <AudioInput isAudioOpen={isAudioOpen} setIsAudioOpen={setIsAudioOpen} chatSocket={chatSocket} setLastAudioInputSequence={setLastAudioInputSequence} setShouldStopAi={setShouldStopAi} isRecording={isRecording} setIsRecording={setIsRecording} diceRollsActive={diceStates.d20.isGlowActive} mediaRecorder={mediaRecorder} setMediaRecorder={setMediaRecorder} audioChunks={audioChunks} />
            </div>
          )
        }


      </div >
    </div >
  )

}
