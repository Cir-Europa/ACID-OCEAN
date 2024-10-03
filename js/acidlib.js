class Track {
    constructor() {
        this.bars = 8;
        this.data = this.generateData();
        this.colours = this.initColours()
    }

    initColours() {
        let colours = []
        for (let i = 0; i < this.bars; i++) {
            colours.push("000000")
        }
        return colours
    }

    generateData() {
        let data = [];
        for (let i = 0; i < this.bars * 4; i++) {
            data.push({
                note: '',
                isAccent: false,
                isPortemento: false,
            });
        }
        return data;
    }

    initClipPreview () { 
        const coloursContainer = document.querySelector('.colours')
    
        for (let i = 0; i < this.bars; i++) {
            const colourPreview = document.createElement('div')
            colourPreview.className = `colour colour-${i}`
            colourPreview.style.background = "#000000"
            coloursContainer.appendChild(colourPreview)
        }

        this.addClickEvent()
    }
    
    displayColour() { 
        for (let i = 0; i < this.bars; i++) {
            document.querySelector(`.colour-${i}`).style.background = `#${this.colours[i]}`; // JQUERY
        }
    }
    
    addClickEvent() {
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('colour')) {
                let index = Number(e.target.classList[1].match(/\d+/g)[0])
                this.colours[index] = paintColour
                this.displayColour()
                this.getDataFromColour()
            }
        });
    }

    getDataFromColour() {
        for (let i = 0; i < this.colours.length; i++) {
            let barBinary = hexToBinary(this.colours[i])
            for (let j = 0; j < 4; j++) {
                let note = binaryToNote(barBinary[j])
                let dataIndex = i * 4 + j
                this.data[dataIndex].isAccent = note.includes("'")
                this.data[dataIndex].isPortemento = note.includes("~")
                this.data[dataIndex].note = note.replace(/['~]/g, "")
            }
        }
        displayMidi(tracks[trackSelection]);
    }

    getColoursFromData() {
        for (let i = 0; i < this.colours.length; i++) {
            let output = ""
            for (let j = 0; j < 4; j++) {
                let dataIndex = i * 4 + j
                let outputNote = this.data[dataIndex].note;
                if (this.data[dataIndex].isPortemento) {
                    outputNote += "~"
                }
                if (this.data[dataIndex].isAccent) {
                    outputNote += "'"
                }

                output += noteToBinary(outputNote)
            }
            this.colours[i] = binaryToHex(output)
        }
        this.displayColour();
    }
 

    playBack() {
        let currentTime = ctx.currentTime; // Start time tracking for real-time or export context
    
        const playColumn = (index) => {
            if (index >= this.data.length) {
                if (isExport) {renderAndExport()}
                return;
            }
    
            let columnTimeMs = noteLengthMs;
            let progressionCount = 1;
    
            const column = this.data[index];
    
            // Handle Portamento: Find the total duration of the current note if portamento exists
            for (let i = index + 1; i < this.data.length; i++) {
                const currentNote = this.data[i];
                const previousNote = this.data[i - 1];
                if (currentNote.note === previousNote.note && previousNote.isPortemento) {
                    if (currentNote.isAccent !== previousNote.isAccent) {
                        break;
                    }
                    columnTimeMs += noteLengthMs;
                    progressionCount++;
                } else {
                    break;
                }
            }
    
            let columnTimeS = columnTimeMs / 1000;
    
            // Schedule the note in the future based on the accumulated `currentTime`
            if (column.note !== '') {
                if (column.isPortemento && this.data[index + 1]) {
                    play(column.note, column.isAccent, columnTimeS, this.data[index + 1].note, 0.2, currentTime);
                } else {
                    play(column.note, column.isAccent, columnTimeS, undefined, 0, currentTime);
                }
            }
    
            // Move the playhead forward by the duration of this note
            currentTime += columnTimeS; // Advance the current time for the next note
    
            // Call playColumn() recursively, but only use setTimeout if it's a real-time play
            if (!isExport) {
                setTimeout(() => {
                    playColumn(index + progressionCount);
                }, columnTimeMs);
            } else {
                // For export, just call the next note immediately
                playColumn(index + progressionCount);
            }
        };
    
        playColumn(0);
    }     
}

function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    setUint32(0x46464952); // "RIFF" in ASCII
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length of "fmt " chunk
    setUint16(1); // PCM format
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample
    setUint32(0x61746164); // "data" chunk
    setUint32(length - pos - 4); // data chunk length

    // Write interleaved data
    for (let i = 0; i < abuffer.numberOfChannels; i++) {
        channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
            const sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            pos += 2;
        }
        offset++;
    }

    return buffer;
}

const sampleRate = 44100;

let ctx = new AudioContext();

const masterVolume = ctx.createGain();
masterVolume.gain.value = 0.5;
masterVolume.connect(ctx.destination);

function play(noteValue, noteAccent, noteDuration, nextNoteValue, portamentoDuration = 0, startTime = 0) {
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(envelope);
    envelope.connect(filter);
    isExport ? filter.connect(ctx.destination) : filter.connect(masterVolume);

    oscillator.type = 'sawtooth';
    const frequency = parseFloat(getFrequency(noteValue));
    oscillator.frequency.value = frequency;

    const attackTime = 0.1;
    const decayTime = 0.3;
    const sustainLevel = 0.5;
    const releaseTime = 0.1;

    const now = startTime || ctx.currentTime;

    filter.Q.value = noteAccent ? 10 : 0.1;

    filter.frequency.setValueAtTime(0, now);
    envelope.gain.setValueAtTime(0, now);

    filter.frequency.linearRampToValueAtTime(2000, now + attackTime);
    envelope.gain.linearRampToValueAtTime(1, now + attackTime);

    if (portamentoDuration > 0 && nextNoteValue) {
        const nextFrequency = parseFloat(getFrequency(nextNoteValue));
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.linearRampToValueAtTime(nextFrequency, now + portamentoDuration);
    }

    filter.frequency.linearRampToValueAtTime(200, now + attackTime + decayTime);
    envelope.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

    oscillator.start(now);
    oscillator.stop(now + noteDuration + releaseTime);

    envelope.gain.setValueAtTime(sustainLevel, now + noteDuration);
    filter.frequency.setValueAtTime(200, now + noteDuration);
    envelope.gain.linearRampToValueAtTime(0, now + noteDuration + releaseTime);

    oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        filter.disconnect();
    };
}

// Once the playback finishes, render the audio buffer and export as WAV
function renderAndExport() {
    ctx.startRendering().then((renderedBuffer) => {
        const wavData = bufferToWave(renderedBuffer, renderedBuffer.length);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        // Create a link to download the WAV file
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'output.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}