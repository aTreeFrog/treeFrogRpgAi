import React, { useState, useEffect, useRef } from 'react';

export default function AudioInput({ isAudioOpen, setIsAudioOpen }) {
    // Define constraints for the audio
    const constraints = { audio: true };
    const analyser = useRef(null);
    const [recordText, setRecordText] = useState("")
    const [isRecording, setIsRecording] = useState(false);
    const micPermission = useRef(null);

    function calculateAverageVolume(dataArray) {
        let sum = 0;

        // Loop through the dataArray
        for (let i = 0; i < dataArray.length; i++) {
            // Each value is an unsigned 8 bit integer, so the midpoint is 128.
            // Subtracting 128 to center around 0 (0 being silence/no sound)
            let value = dataArray[i] - 128;

            // As we want amplitude to be positive, take the absolute value.
            sum += Math.abs(value);
        }

        // Calculate the average of the summed amplitudes
        let averageAmplitude = sum / dataArray.length;

        // (Optional) Convert to a percentage of the max amplitude (128 in this case)
        let averageVolume = (averageAmplitude / 128) * 100;

        return averageVolume;
    }

    const updateCircle = () => {
        let dataArray = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteTimeDomainData(dataArray);

        let averageVolume = calculateAverageVolume(dataArray);
        console.log("averageVolume: ", averageVolume);
        const baseSize = 50;
        const maxGrowthSize = 150;
        let newSize = baseSize + ((averageVolume / 10) * maxGrowthSize);

        const circleDiv = document.getElementById('audioCircle');
        circleDiv.style.width = `${newSize}px`;
        circleDiv.style.height = `${newSize}px`;

    }


    const obtainAudioData = () => {
        // Request access to the microphone
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (stream) {
                // User has granted permission
                // Now you can use the stream for your purpose
                // For example, connecting it to the Web Audio API
                const audioContext = new AudioContext();
                analyser.current = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser.current);
                console.log("analyser", analyser.current);
                console.log("analyser calls", Object.getPrototypeOf(analyser.current));
                setRecordText("Click to Stop Recording");
                setIsRecording(true);

            })
            .catch(function (err) {
                // User denied the permission or an error occurred
                console.error('Could not get user media:', err);
                // Handle the error by informing the user or disabling microphone-dependent features
            });

    };

    useEffect(() => {

        navigator.permissions.query({ name: 'microphone' })
            .then(function (permissionStatus) {
                micPermission.current = permissionStatus;
                console.log('Microphone permission state is ', permissionStatus.state);
                permissionStatus.onchange = function () {
                    console.log('Microphone permission state has changed to ', this.state);
                };
            });

        obtainAudioData();

    }, []);

    useEffect(() => {

        if (micPermission.current?.state) {
            if (micPermission.current.state != "granted") {
                setRecordText("Mic not enabled");
                setIsRecording(false);
            } else {
                obtainAudioData();
            }
        }

    }, [micPermission]);

    const handleComplete = () => {

    }

    const handleCancel = () => {
        setIsAudioOpen(false);
    }


    return (
        < div class="flex flex-col justify-center items-center -mt-3 bg-purple-900 p-6 rounded-lg border border-gray-500 space-y-4" >

            <button id="audioCircle" className={`audio-circle flex justify-center items-center text-white font-semibold relative px-4 bg-gray-500 inline-block overflow-visible whitespace-nowrap ${setIsRecording ? 'animate-grow-shrink' : ''}`}
                onClick={() => handleComplete()}>
                {recordText}
            </button>
            <button class=" -mt-4 flex justify-center items-center text-white font-bold text-xl bg-red-600 h-10 w-10 rounded-full"
                onClick={() => handleCancel()}>
                X
            </button>
        </div >


    );
}
