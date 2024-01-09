import React, { useState, useEffect, useRef } from 'react';

export default function AudioInput({ isAudioOpen, setIsAudioOpen, chatSocket, setLastAudioInputSequence }) {
    // Define constraints for the audio
    const constraints = { audio: true };
    const analyser = useRef(null);
    const [recordText, setRecordText] = useState("Click to Start recording")
    const [isRecording, setIsRecording] = useState(false);
    const micPermission = useRef(null);
    const audioInputSequence = useRef(0);
    //const mediaRecorder = useRef(null);
    const isStoppingRecording = useRef(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    // function calculateAverageVolume(dataArray) {
    //     let sum = 0;

    //     // Loop through the dataArray
    //     for (let i = 0; i < dataArray.length; i++) {
    //         // Each value is an unsigned 8 bit integer, so the midpoint is 128.
    //         // Subtracting 128 to center around 0 (0 being silence/no sound)
    //         let value = dataArray[i] - 128;

    //         // As we want amplitude to be positive, take the absolute value.
    //         sum += Math.abs(value);
    //     }

    //     // Calculate the average of the summed amplitudes
    //     let averageAmplitude = sum / dataArray.length;

    //     // (Optional) Convert to a percentage of the max amplitude (128 in this case)
    //     let averageVolume = (averageAmplitude / 128) * 100;

    //     return averageVolume;
    // }

    // const updateCircle = () => {
    //     let dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    //     analyser.current.getByteTimeDomainData(dataArray);

    //     let averageVolume = calculateAverageVolume(dataArray);
    //     console.log("averageVolume: ", averageVolume);
    //     const baseSize = 50;
    //     const maxGrowthSize = 150;
    //     let newSize = baseSize + ((averageVolume / 10) * maxGrowthSize);

    //     const circleDiv = document.getElementById('audioCircle');
    //     circleDiv.style.width = `${newSize}px`;
    //     circleDiv.style.height = `${newSize}px`;

    // }

    // const grabAudioData = () => {
    //     mediaRecorder.current.ondataavailable = event => {
    //         setRecordText("Click to stop recording");
    //         setIsRecording(true);
    //         if (event.data.size > 0) {
    //             sendAudioChunkToAPI(event.data);
    //             audioInputSequence.current++;
    //             if (isStoppingRecording.current) {
    //                 setLastAudioInputSequence(audioInputSequence.current);
    //                 console.log('Last recording chunk processed.');
    //                 setIsRecording(false);
    //                 setRecordText("Recording Ended. Click to Start again");
    //             }
    //         }
    //     };

    //     mediaRecorder.current.onstop = () => {
    //         console.log('Recording stopped.');
    //         stream.getTracks().forEach(track => track.stop());
    //     };
    // };

    // const initAudioData = () => {
    //     // Request access to the microphone
    //     navigator.mediaDevices.getUserMedia(constraints)
    //         .then(function (stream) {
    //             // User has granted permission
    //             // Now you can use the stream for your purpose
    //             // For example, connecting it to the Web Audio API

    //             mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    //             // const audioContext = new AudioContext();
    //             // analyser.current = audioContext.createAnalyser();
    //             // const source = audioContext.createMediaStreamSource(stream);
    //             // source.connect(analyser.current);
    //             // console.log("analyser", analyser.current);
    //             // console.log("analyser calls", Object.getPrototypeOf(analyser.current));

    //         })
    //         .catch(function (err) {
    //             // User denied the permission or an error occurred
    //             console.error('Could not get user media:', err);
    //             // Handle the error by informing the user or disabling microphone-dependent features
    //         });

    // };

    const handleButton = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordText("Click to Start recording");
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            sendAudioChunkToAPI(audioBlob);

        } else if (mediaRecorder && mediaRecorder.state != "recording") {
            mediaRecorder.start();
            setIsRecording(true);
            setAudioChunks([]);
            setRecordText("Click to finish recording");
        }

    }

    const handleCancel = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            setIsRecording(false);
            setRecordText("Click to Start recording");
        }

        setIsAudioOpen(false);
    }

    const sendAudioChunkToAPI = (audioChunk) => {
        // Function to send the audio chunk to your API
        // Implement the API call logic here
        console.log('Sending audio chunk to API...');
        const data = {
            model: "whisper-1",
            input: audioChunk,
        };
        //chatSocket.emit('player audio stream', data);
        // Example: POST request to your API
    };

    // function handleStream(stream) {
    //     mediaRecorder.current = new MediaRecorder(stream);
    //     let audioChunks = [];

    //     mediaRecorder.current.ondataavailable = (event) => {
    //         console.log("on data available");
    //         audioChunks.push(event.data);
    //         sendAudioChunkToAPI(event.data);
    //     };

    //     mediaRecorder.current.start();

    //     // Collect chunks every 5 seconds
    //     const interval = setInterval(() => {
    //         if (mediaRecorder.current.state === 'recording') {

    //             mediaRecorder.current.requestData(); // force data dispatch

    //             if (isStoppingRecording.current == true) {
    //                 console.log("stop recording area");
    //                 mediaRecorder.current.stop();
    //                 mediaRecorder.current.requestData();
    //                 stream.getTracks().forEach(track => track.stop()); // Close the mic input
    //                 mediaRecorder.current.onstop = () => {
    //                     // Handle the recorded chunks here (e.g., process or upload them)
    //                     console.log(audioChunks);
    //                     audioChunks = []; // Clear the chunks array
    //                 };

    //                 clearInterval(interval);
    //             }
    //         } else {
    //             clearInterval(interval);
    //         }
    //     }, 5000);

    // }

    useEffect(() => {

        navigator.permissions.query({ name: 'microphone' })
            .then(function (permissionStatus) {
                micPermission.current = permissionStatus;
                console.log('Microphone permission state is ', permissionStatus.state);
                permissionStatus.onchange = function () {
                    console.log('Microphone permission state has changed to ', this.state);
                };
            });

        // Request permissions to record audio
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                setMediaRecorder(recorder);
                recorder.ondataavailable = e => setAudioChunks(prev => [...prev, e.data]);
            });

    }, []);

    useEffect(() => {

        if (micPermission.current?.state) {
            if (micPermission.current.state != "granted") {
                setRecordText("Mic not enabled");
                setIsRecording(false);
            } else {
                //obtainAudioData();
            }
        }

    }, [micPermission]);


    return (
        < div class="flex flex-col justify-center items-center -mt-3 bg-purple-900 p-6 rounded-lg border border-gray-500 space-y-4" >

            <button id="audioCircle" className={`audio-circle flex justify-center items-center text-white font-semibold relative px-4 bg-gray-500 inline-block overflow-visible whitespace-nowrap ${isRecording ? 'animate-grow-shrink' : ''}`}
                onClick={() => handleButton()}>
                {recordText}
            </button>
            <button class=" -mt-4 flex justify-center items-center text-white font-bold text-xl bg-red-600 h-10 w-10 rounded-full"
                onClick={() => handleCancel()}>
                X
            </button>
        </div >


    );
}
