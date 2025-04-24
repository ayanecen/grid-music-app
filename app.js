const chordFrequencies = {
    'C': [261.63, 329.63, 392.00], // C, E, G
    'D': [293.66, 369.99, 440.00], // D, F#, A
    'E': [329.63, 415.30, 493.88], // E, G#, B
    'F': [349.23, 440.00, 523.25], // F, A, C
    'G': [392.00, 493.88, 587.33], // G, B, D
    'A': [440.00, 554.37, 659.25], // A, C#, E
    'B': [493.88, 622.25, 739.99]  // B, D#, F#
};

const chordTypes = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'sus9': [0, 2, 7],
    'maj7': [0, 4, 7, 11],
    'min7': [0, 3, 7, 10],
    'dom7': [0, 4, 7, 10]
};

function getFrequencyMultiplier(key) {
    const semitoneMap = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    const semitone = semitoneMap[key];
    return Math.pow(2, semitone / 12);
}

function adjustFrequenciesForKey(frequencies, key) {
    const multiplier = getFrequencyMultiplier(key);
    return frequencies.map(freq => freq * multiplier);
}

function adjustFrequenciesForChordType(frequencies, chordType) {
    const intervals = chordTypes[chordType];
    return intervals.map(interval => frequencies[0] * Math.pow(2, interval / 12));
}

let selectedChordType = 'major';

document.querySelectorAll('.chord-button').forEach(button => {
    button.addEventListener('click', () => {
        selectedChordType = button.getAttribute('data-chord');
        document.querySelectorAll('.chord-button').forEach(btn => btn.style.backgroundColor = '#3a3a3a');
        button.style.backgroundColor = '#4a4a4a';
    });
});

function playChord(note) {
    const key = document.getElementById('key-select').value;
    const baseFrequencies = adjustFrequenciesForKey(chordFrequencies[note], key);
    const frequencies = adjustFrequenciesForChordType(baseFrequencies, selectedChordType);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.2; // 音量を下げる
    gainNode.connect(audioContext.destination);

    // 簡易リバーブの設定
    const delayNode = audioContext.createDelay();
    delayNode.delayTime.value = 0.2; // 200msのディレイ
    const feedbackGain = audioContext.createGain();
    feedbackGain.gain.value = 0.5; // フィードバックの強さ
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    delayNode.connect(gainNode);

    const instrument = document.getElementById('instrument').value;
    let oscillatorType = 'sine';
    let attackTime = 0.1;
    let decayTime = 1.5;

    switch (instrument) {
        case 'piano':
            oscillatorType = 'sawtooth';
            break;
        case 'guitar':
            oscillatorType = 'triangle';
            attackTime = 0.05;
            decayTime = 1.0;
            break;
        case 'organ':
            oscillatorType = 'sine';
            attackTime = 0.2;
            decayTime = 2.0;
            break;
        case 'vibraphone':
            oscillatorType = 'square';
            attackTime = 0.1;
            decayTime = 1.2;
            break;
    }

    frequencies.forEach(frequency => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = oscillatorType;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        const envelope = audioContext.createGain();
        envelope.gain.setValueAtTime(0, audioContext.currentTime);
        envelope.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + attackTime); // アタック
        envelope.gain.linearRampToValueAtTime(0, audioContext.currentTime + decayTime); // ディケイ
        oscillator.connect(envelope);
        envelope.connect(delayNode);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, decayTime * 1000);
    });
    setTimeout(() => {
        audioContext.close();
    }, decayTime * 1000);
}

let recordedSequence = [];

function updateRecordedSequenceList() {
    const sequenceList = document.getElementById('sequence-list');
    sequenceList.innerHTML = '';
    recordedSequence.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.chord} (${item.type})`;
        sequenceList.appendChild(li);
    });
}

document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', () => {
        const chord = button.textContent;
        recordedSequence.push({ chord, type: selectedChordType });
        updateRecordedSequenceList();
        playChord(chord);
    });
});

document.getElementById('clear-sequence').addEventListener('click', () => {
    recordedSequence = [];
    updateRecordedSequenceList();
});

function playRecordedSequence() {
    let index = 0;
    const playNextChord = () => {
        if (index < recordedSequence.length) {
            playChord(recordedSequence[index].chord);
            index++;
            setTimeout(playNextChord, 1000); // 1秒ごとに次のコードを再生
        }
    };
    playNextChord();
}

document.getElementById('play-sequence').addEventListener('click', playRecordedSequence); 