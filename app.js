const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US';

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const speechBtn = document.getElementById('speech-btn');
const output = document.getElementById('output');
const progressBar = document.getElementById('progress-bar');
const seekBar = document.getElementById('seek-bar');
const timeDisplay = document.getElementById('time-display');

let finalTranscript = '';
let utterance;
let speechStartTime = 0;
let intervalId;
let isSeeking = false;

recognition.onresult = (event) => {
    const results = event.results;
    finalTranscript = Array.from(results)
        .map((result) => result[0].transcript)
        .join('');
    output.innerText = finalTranscript;
};

recognition.onerror = (event) => {
    console.error('Speech recognition error detected: ' + (event.error || 'Unknown error'));
};

recognition.onend = () => {
    console.log('Speech recognition service disconnected');
};

startBtn.addEventListener('click', () => {
    finalTranscript = '';
    recognition.start();
    console.log('Speech recognition started');
});

stopBtn.addEventListener('click', () => {
    recognition.stop();
    console.log('Speech recognition stopped');
});

speechBtn.addEventListener('click', () => {
    if (utterance) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech synthesis
        clearInterval(intervalId);
        updateProgressBar(0, 0); // Reset progress bar
    }
    utterance = new SpeechSynthesisUtterance(finalTranscript);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
        speechStartTime = Date.now();
        intervalId = setInterval(updateProgress, 100);
    };

    utterance.onend = () => {
        clearInterval(intervalId);
        updateProgressBar(100, 100); // Set progress bar to 100%
    };

    window.speechSynthesis.speak(utterance);
});

seekBar.addEventListener('input', (event) => {
    if (utterance && !isSeeking) {
        isSeeking = true;
        const seekPercentage = event.target.value;
        const duration = utterance.text.length * 100; // Rough estimation of duration
        const seekTime = (seekPercentage / 100) * duration;
        
        clearInterval(intervalId);
        window.speechSynthesis.cancel();
        updateProgressBar(seekPercentage, duration / 1000);

        utterance = new SpeechSynthesisUtterance(finalTranscript);
        utterance.lang = 'en-US';

        utterance.onstart = () => {
            speechStartTime = Date.now() - seekTime;
            intervalId = setInterval(updateProgress, 100);
        };

        utterance.onend = () => {
            clearInterval(intervalId);
            updateProgressBar(100, 100); // Set progress bar to 100%
            isSeeking = false;
        };

        window.speechSynthesis.speak(utterance);
    }
});

function updateProgress() {
    const elapsedTime = Date.now() - speechStartTime;
    const duration = utterance ? utterance.text.length * 100 : 100; // Rough estimation of duration
    const percentage = Math.min((elapsedTime / duration) * 100, 100);
    updateProgressBar(percentage, duration / 1000);
}

function updateProgressBar(percentage, durationInSeconds) {
    progressBar.style.width = `${percentage}%`;
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    const elapsedMinutes = Math.floor((percentage / 100) * durationInSeconds / 60);
    const elapsedSeconds = Math.floor((percentage / 100) * durationInSeconds % 60);

    timeDisplay.textContent = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')} / ${minutes}:${seconds.toString().padStart(2, '0')}`;
}
