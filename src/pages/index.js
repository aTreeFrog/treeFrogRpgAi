import { useState, useEffect, useRef } from "react";
import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import axios from 'axios';
import TypingAnimation from "../components/TypingAnimation";
import HexagonDice from "../components/HexagonDice"
import io from 'Socket.IO-client'
import JitsiMeetComponent from '../components/JitsiMeetComponent';
import CharacterSheet from '../components/CharacterSheet';

const inter = Inter({ subsets: ['latin'] })

const chatUrl = '/api/chat';
const chatSocket = io('http://localhost:3001', { path: chatUrl });

chatSocket.onopen = function (event) {
  console.log("Connection established!");
};

chatSocket.onerror = function (error) {
  console.error("WebSocket Error: ", error);
};

chatSocket.onclose = function (event) {
  console.log("Connection closed:", event);
};

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dalleImageUrl, setDalleImageUrl] = useState('');
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
  const lastLineCount = useRef(null);
  const lastScrollHeight = useRef(null);

  // Whenever chatLog updates, update the ref
  useEffect(() => {
    chatLogRef.current = chatLog;
    if (chatLogRef.current.length && chatLogRef.current[chatLogRef.current.length - 1].type === 'user') {
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


  useEffect(() => {
    // Emit event to server to create a meeting when component mounts
    chatSocket.emit('create-meeting');


    // Listen for the server's response
    chatSocket.once('meeting-created', (data) => {
      console.log("Meeting created:", data);
      setMeetingDetails(data); // Save the meeting details in state
    });

    // Cleanup listener when component unmounts
    return () => {
      chatSocket.off('meeting-created');
    };

  }, []);


  let lastMessage = [];
  // Function to process a single oldest message from the queue
  const processQueue = () => {
    if (messageQueue.current.length > 0) { //gives max amount so cancel button goes away quicker
      const msg = messageQueue.current.shift(); // Get the oldest message
      console.log("msg: ", msg);
      setChatLog((prevChatLog) => {
        console.log("here huh?")
        let updatedChatLog = [...prevChatLog];
        if (prevChatLog.length === 0 || prevChatLog[prevChatLog.length - 1].type !== 'bot') {
          updatedChatLog.push({ type: 'bot', message: msg });
        } else {
          // Append new content to the last message if it's also from the bot
          let lastEntry = updatedChatLog[updatedChatLog.length - 1];
          console.log("lastEntry: ", lastEntry.message);
          // its repeating somewhere so i needed to add this
          if (!lastEntry.message.endsWith(msg)) {
            lastEntry.message += msg; // Append new chunk to last message content
            console.log("lastEntry again: ", lastEntry.message);
          }
        }

        console.log("this spot?");

        lastMessage = updatedChatLog;
        return updatedChatLog;
      });
    }
  };

  const textToSpeechCall = async (text) => {
    const data = {
      model: "tts-1",
      voice: "onyx",
      input: text,
    };
    console.log("about to send emit for speech: ", text);
    // Convert the message object to a string and send it
    //chatSocket.emit('audio message', data);

  };

  // Ref to track if audio is currently playing
  const playNextAudio = () => {
    console.log("playNextAudio expectedSequence: ", expectedSequence.current)
    if (audioQueue.current.has(expectedSequence.current) && !audio.current) {
      audio.current = true;
      const audioSrc = audioQueue.current.get(expectedSequence.current);
      audioQueue.current.delete(expectedSequence.current);
      newAudio.current = new Audio(audioSrc);
      newAudio.current.volume = 1;
      newAudio.current.play().then(() => {
        // Do something when audio starts playing if needed
      }).catch(err => {
        console.error("Error playing audio:", err);
        audio.current = false;
      });

      newAudio.current.onended = () => {
        audio.current = false;  // Assuming you want to clear the current audio
        expectedSequence.current++;
      };
    }
  };

  const cancelButtonMonitor = () => {

    if (audioQueue?.current.size > 0 || messageQueue.current.length > 0 || audio.current) {
      setCancelButton(prevValue => Math.min(prevValue + 2, 8));
    } else {
      setCancelButton(prevValue => Math.max(0, prevValue - 1));
    }
  }

  //adjust text input bar height based on amount of user input.
  const handleInputChange = (e) => {
    const textarea = e.target;
    const value = textarea.value;
    setInputValue(value); // existing state update

    if (typeof window !== 'undefined') {
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight, 10) || 20;
      const currentScrollHeight = textarea.scrollHeight;

      // Calculate the number of lines
      const numberOfLines = Math.ceil(currentScrollHeight / lineHeight);

      // Only update if the number of lines has changed or if the textarea is shrinking
      if (numberOfLines !== lastLineCount.current || currentScrollHeight > parseInt(inputTextHeight, 10)) {
        textarea.style.height = `${currentScrollHeight}px`;
        setInputTextHeight(currentScrollHeight); // Update state with the new height

        lastLineCount.current = numberOfLines; // Update the last line count
      }
    }
  };



  useEffect(() => {
    // Set up the interval to process the message queue every x ms
    const intervalId = setInterval(() => {
      processQueue();
    }, 400);

    // Set up the interval to process audio queue every x ms
    const audioIntervalId = setInterval(() => {
      playNextAudio();
    }, 200);

    const cancelButtonIntervalId = setInterval(() => {
      cancelButtonMonitor();
    }, 200);
    return () => {
      clearInterval(intervalId); // Clear the interval on component unmount
      clearInterval(audioIntervalId); // Clear the interval on component unmount
      clearInterval(cancelButtonIntervalId);
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

  // Function to check scrolling and adjust visibility of something based on scroll position
  // const checkScrolling = () => {
  //   const scrollableDiv = document.getElementById('scrollableDiv');
  //   const scrollArrow = document.getElementById('scrollArrow');
  //   if (scrollableDiv.scrollHeight > scrollableDiv.clientHeight &&
  //     scrollableDiv.scrollTop < scrollableDiv.scrollHeight - scrollableDiv.clientHeight) {
  //     //scrollArrow.classList.remove('hidden'); // Show arrow
  //   } else {
  //     //scrollArrow.classList.add('hidden'); // Hide arrow
  //   }
  // }

  useEffect(() => {
    if (scrollableDivRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableDivRef.current;

      const isUserAtBottom = () => {
        const tolerance = 40; // Adjust this value as needed
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
      console.log("isAtBottom: ", isAtBottom);

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

    console.log("meeting details", meetingDetails.meetingUr);

    event.preventDefault();

    if (cancelButton !== 0) {
      chatSocket.emit('cancel processing');
      messageQueue.current = [];
      audioQueue.current = new Map();
      setCancelButton(0);
      setIsLoading(false);

      if (newAudio.current) {
        if (!newAudio.current.paused) {
          newAudio.current.pause();
          newAudio.current.currentTime = 0; // Reset only if it was playing
          newAudio.current = null;
        }
        audio.current = false;
      }

    } else {

      chatSocket.emit('resume processing');
      audio.current = false;

      if (inputValue.length > 0) {

        messageQueue.current = [];
        chatSocket.emit('reset audio sequence');
        expectedSequence.current = 0;
        audioQueue.current = new Map();

        setChatLog((prevChatLog) => [...prevChatLog, { type: 'user', message: inputValue }])

        sendMessage(inputValue);

        setInputValue('');

        //sendImageMessage(inputValue);

      }

    }
  }

  const sendMessage = (message) => {

    const data = {
      model: "gpt-4",
      messages: [{ "role": "user", "content": message }],
      stream: true,
    };
    console.log("about to send message: ", message);
    // Convert the message object to a string and send it
    chatSocket.emit('chat message', data);
    setIsLoading(true);

  }

  useEffect(() => {

    const handleChatMessage = (msg) => {
      setCancelButton(1);
      setIsLoading(false);
      console.log('Received:', msg);
      messageQueue.current.push(msg);
      tempBuffer.current += msg; // Modify tempBuffer ref

      // Process the buffer to extract complete sentences
      let lastIndex = 0;  // To track the last index of end-of-sentence punctuation
      for (let i = 0; i < tempBuffer.current.length; i++) {
        // Check for sentence termination (.,!,?)
        if (tempBuffer.current[i] === '.' || tempBuffer.current[i] === '!' || tempBuffer.current[i] === '?') {
          // Extract the sentence
          let sentence = tempBuffer.current.substring(lastIndex, i + 1).trim();
          if (sentence.length > 0) {
            console.log("sentence: ", sentence);
            textToSpeechCall(sentence);
          }
          lastIndex = i + 1;  // Update the last index to the new position
        }
      }

      // Keep only the incomplete sentence part in the buffer
      tempBuffer.current = tempBuffer.current.substring(lastIndex);


    };


    const onChatComplete = () => {
      console.log("onChatComplete!!!");
      //setCancelButton(0); // Assuming setCancelButton is a state setter function
      if (tempBuffer.current.length > 0) {
        console.log("chat complete buffer: ", tempBuffer.current);
        textToSpeechCall(tempBuffer.current);
      }
      tempBuffer.current = '';

    };

    // Attach the event listener only once when the component mounts
    chatSocket.on('chat message', handleChatMessage);
    chatSocket.on('chat complete', onChatComplete);

    chatSocket.on('play audio', (recording) => {
      const audioSrc = `data:audio/mp3;base64,${recording.audio}`;
      console.log("play audio sequence: ", recording.sequence);
      audioQueue.current.set(recording.sequence, audioSrc);
      //audioQueue.current.push(audioSrc);
      //playNextAudio();
    });

    // Return a cleanup function to remove the event listener when the component unmounts
    return () => {
      chatSocket.off('chat message', handleChatMessage);
      chatSocket.off('chat complete', onChatComplete);
      chatSocket.off('play audio');
    };
  }, []);

  const sendImageMessage = (message) => {
    const url = '/api/image';
    const data = {
      model: "dall-e-3",
      prompt: "a dungeons and dragons like book image of a rogue and a wizard about to enter a tavern on a dark snowy night",
      n: 1,
      size: "1024x1024",
      quality: "hd",
    };

    console.log("am i here?");

    axios.post(url, data).then((response) => {
      setDalleImageUrl(response.data.data[0].url);
      console.log("dalleImageUrl", dalleImageUrl);
    }).catch((error) => {
      console.log(error);
    })
  }

  return (
    <div className="flex justify-center items-start h-screen bg-gray-900 overflow-hidden">
      {/* Left Box */}
      <div className="flex-1 max-w-[400px] border border-white">
        <div className="flex flex-col h-screen justify-between"> {/* Adjusted for spacing */}
          <div>
            <h1 className="break-words bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center py-3 font-bold text-3xl md:text-4xl">Character</h1>
            <div>
              <CharacterSheet name="Aragorn" race="Human" characterClass="Ranger" level="5" />
            </div>
            <div className="container mx-auto flex flex-col items-center justify-start pt-20">
              <HexagonDice />
            </div>
          </div>
          {/* Toggle Meeting Panel Button */}
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
            className="absolute bottom-0 left-20 mb-9 ml-12 bg-purple-500 hover:bg-purple-700 text-white font-bold transition-colors duration-300 py-2 px-4 rounded"
          >
            {isPanelOpen ? 'Hide Party' : 'Open Party'}
          </button>
          {/* Floating Jitsi Meeting Panel */}
          <div className={`absolute bottom-0 left-0 mb-20 ml-20 p-3 bg-black border border-gray-200 rounded-lg shadow-lg max-w-[250px] ${isPanelOpen ? 'visible w-96 h-[30rem]' : 'invisible h-0 overflow-hidden'}`}>
            <JitsiMeetComponent meetingRoom={meetingDetails?.roomName} onApiReady={handleApiReady} />
          </div>
        </div>
      </div>
      {/* Center Box (Original Content) */}
      <div className="flex-1 max-w-[700px] border border-white">
        <div className="flex flex-col h-screen justify-start">
          <h1 className="break-words bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center py-3 font-bold text-3xl md:text-4xl">Story</h1>
          {/* Conditional DALL·E Image */}
          {dalleImageUrl && (
            <img
              src={dalleImageUrl}
              alt="DALL·E Generated"
              className="w-4/5 md:w-3/4 h-auto mx-auto rounded-lg shadow-lg md: mt-12"
            />
          )}
        </div>
      </div>
      {/* Right Box */}
      <div className="flex-1 max-w-[450px] bg-gray-800 p-4 relative flex flex-col h-[100vh] border border-white">
        {/* Sticky Header */}
        <h1 className="sticky top-0 z-10 break-words bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text text-center pt-0 pb-5 font-semibold focus:outline-none text-3xl md:text-4xl">Game Master</h1>
        {/* Scrollable Content */}
        <div ref={scrollableDivRef} className="overflow-y-auto flex-grow" id="scrollableDiv">
          <div className="flex flex-col space-y-4 p-6">
            {chatLog.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                <div className={`${message.type === 'user' ? 'bg-purple-500' : 'bg-gray-800'
                  } rounded-lg p-2 text-white max-w-sm`}>
                  {message.message}
                </div>
              </div>
            ))}
            {isLoading && (
              <div key={chatLog.length} className="flex justify-start">
                <div className="bg-gray-800 rounded-lg p-4 text-white max-w-sm">
                  <TypingAnimation />
                </div>
              </div>
            )}
            {/* Arrow Button at the Bottom Middle, initially hidden */}
            <button
              id="scrollArrow"
              className={`${isAtBottom ? 'hidden' : ''} absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-full`}
              onClick={scrollToBottom}>
              ↓
            </button>
          </div>
        </div>

        {/* Fixed Send Message Form or other bottom content */}
        <form onSubmit={handleSubmit} className="mt-auto p-6">
          <div className="flex items-center rounded-lg border border-gray-700 bg-gray-800" style={{ position: 'relative' }}>
            {/* Make sure the input container can grow and the button stays aligned */}
            <div className="message-input-container flex-grow" style={{ minHeight: `${inputTextHeight}px`, position: 'relative', zIndex: 2 }}>
              <textarea
                className="w-full px-4 py-2 bg-transparent text-white focus:outline-none"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => handleInputChange(e)}
                style={{ minHeight: '10px' }} // Adjust as needed
                rows={1} // Start with one row
              ></textarea>
            </div>
            <button type="submit" style={{ position: 'relative', zIndex: 1 }} className="bg-purple-500 rounded-lg px-4 py-2 text-white font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300">
              {cancelButton !== 0 ? '▮▮' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div >
  )

}
