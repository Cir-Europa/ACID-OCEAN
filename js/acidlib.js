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
            coloursContainer.appendChild(colourPreview)
        }

        this.displayColour()
    }
    
    displayColour() { 
        for (let i = 0; i < this.bars; i++) {
            const element = document.querySelector(`.colour-${i}`);

            element.style.background = `#${this.colours[i]}`;
            element.setAttribute('colour', `${this.colours[i]}`);
        }
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
        if (isExport) {
            ctx = new OfflineAudioContext(2, sampleRate * 40, sampleRate);
            this.startPlayback();
        } else {
            if (ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    isPlaying = true
                    this.startPlayback();
                    autoStop = setTimeout(stopPlaying, (sixteenthMs * 4 * this.bars) + 200)
                });
            } else {
                this.startPlayback();
            }
        }
    }       
    
    startPlayback() {
        let startTime = ctx.currentTime;
    
        const playColumn = (index, noteStartTime) => {

            if (index >= this.data.length) {
                if (isExport) {
                    renderAndExport();
                }
                return;
            }
    
            let noteTimeMs = sixteenthMs;
            let progressionCount = 1;
            const column = this.data[index];
            let accentData = []
    
            // note extend
            for (let i = index + 1; i < this.data.length; i++) {
                const currentNote = this.data[i];
                const previousNote = this.data[i - 1];
                accentData.push(previousNote.isAccent)
    
                // Break if the current note is different from the previous note
                if (currentNote.note === previousNote.note && previousNote.isPortemento) {
                    noteTimeMs += sixteenthMs;
                    progressionCount++;
                } else {
                    break;
                }
            }
    
            let noteTimeS = noteTimeMs / 1000; // Convert to seconds
    
            // Play the note at the correct time, using AudioContext's time
            if (column.note !== '') {
                if (column.isPortemento && this.data[index + 1]) {
                    play(column.note, accentData, noteTimeS, this.data[index + 1].note, 0.2, noteStartTime);
                } else {
                    play(column.note, accentData, noteTimeS, null, 0, noteStartTime);
                }
            }
    
            // Schedule the next note based on the AudioContext's time
            let nextStartTime = noteStartTime + noteTimeS;
            playColumn(index + progressionCount, nextStartTime); // Schedule next column to play
        };
    
        // Start playing the first column
        playColumn(0, startTime);
    }    
}

function stopPlaying() {
    if (isPlaying) {
        isPlaying = false
        ctx.close()
        $('#playBack').html('<i class="i fluent:play-24-filled"></i>')
        initContext()
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

let ctx = "";
let masterVolume = "";

function initContext() {
    ctx = new AudioContext();

    masterVolume = ctx.createGain();
    masterVolume.gain.value = 0.5;
    masterVolume.connect(ctx.destination);
}

// what if note accent was an array of booleans?

function play(noteValue, noteAccent, noteDuration, nextNoteValue, portamentoDuration = 0, startTime = ctx.currentTime) {

    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(envelope);
    envelope.connect(filter);
    filter.connect(isExport ? ctx.destination : masterVolume); // Use masterVolume unless exporting

    oscillator.type = 'sawtooth';
    const frequency = parseFloat(getFrequency(noteValue));
    oscillator.frequency.setValueAtTime(frequency, startTime);

    const attackTime = 0.1;
    const decayTime = 0.3;
    const sustainLevel = 0.5;
    const releaseTime = 0.1;

    const sixteenthLength = noteAccent.length / noteDuration
    let accentTime = startTime;

    for (let i = 0; i < noteAccent.length; i++) {
        if (i === 0) {
            filter.Q.setValueAtTime(noteAccent[i] ? 10 : 0.1, accentTime);
        } else {
            filter.Q.setValueAtTime(noteAccent[i - 1] ? 10 : 0.1, accentTime);
            filter.Q.linearRampToValueAtTime(noteAccent[i] ? 10 : 0.1, accentTime + attackTime);
            console.log('hello')
        }
        accentTime += sixteenthS;
        console.log(filter.Q.value, noteAccent[i])
    }    

    //filter.Q.value = noteAccent[0] ? 10 : 0.1;

    // Envelope and filter frequency settings based on startTime
    filter.frequency.setValueAtTime(0, startTime);
    envelope.gain.setValueAtTime(0, startTime);

    filter.frequency.linearRampToValueAtTime(2000, startTime + attackTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attackTime);

    if (portamentoDuration > 0 && nextNoteValue) {
        const nextFrequency = parseFloat(getFrequency(nextNoteValue));
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.linearRampToValueAtTime(nextFrequency, startTime + portamentoDuration);
    }

    filter.frequency.linearRampToValueAtTime(200, startTime + attackTime + decayTime);
    envelope.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);

    // Schedule the stop event at the correct time
    oscillator.start(startTime);
    oscillator.stop(startTime + noteDuration + releaseTime);

    envelope.gain.setValueAtTime(sustainLevel, startTime + noteDuration);
    filter.frequency.setValueAtTime(200, startTime + noteDuration);
    envelope.gain.linearRampToValueAtTime(0, startTime + noteDuration + releaseTime);

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

        initContext()
    });
}