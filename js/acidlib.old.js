// Cursor Status
let isAccent = false;
let isPaint = false;
let paintColour = document.querySelector('#color').value.substring(1)

const project = {
    bpm: 135,
    bars: 8,
    barWidth: 300
}

class Track {
    constructor() {
        this.bars = 8;
        this.barDivision = 4;
        this.scale = ["Ab3", "A3", "Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4"].reverse();
        this.bpm = 135
        this.noteLengthMs = (60000 / this.bpm) / 4
        this.noteLengthS = ((60000 / this.bpm) / 4) * 100
        this.data = this.generateData();
        this.colours = this.initColours()
        this.initTrack();
        this.initClipPreview();
    }

    initClipPreview () {
        const coloursContainer = document.querySelector('.colours')

        for (let i = 0; i < this.bars; i++) {
            const colourPreview = document.createElement('div')
            colourPreview.className = `colour colour-${i}`
            colourPreview.style.background = "#000000"
            coloursContainer.appendChild(colourPreview)
        }
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
        for (let i = 0; i < this.bars; i++) {
            let barData = [];
            for (let j = 0; j < this.barDivision; j++) {
                barData.push({
                    note: '',
                    isAccent: false
                });
            }
            data.push(barData);
        }
        return data;
    }

    initTrack() {
        for (let i = 0; i < this.bars; i++) {
            const bar = this.createBar(i);
            for (let j = 0; j < this.barDivision; j++) {
                const column = this.createcolumn(j);
                this.scale.forEach(noteValue => {
                    const note = this.createNoteElement(noteValue);
                    column.appendChild(note);
                });
                bar.appendChild(column);
            }
            editor.appendChild(bar);
        }
        this.addClickEvent();
        this.drawCSS();
    }

    createBar(index) {
        const bar = document.createElement('div');
        bar.classList.add('bar', `bar-${index}`);
        return bar;
    }

    createcolumn(index) {
        const column = document.createElement('div');
        column.classList.add('column', `column-${index}`);
        return column;
    }

    createNoteElement(noteValue) {
        const note = document.createElement('div');
        note.classList.add('note');
        if (noteValue !== '') {
            let noteNoOctave = noteValue.replace(/[0-9]/g, '');
            note.classList.add(noteValue, noteNoOctave);
        }
        return note;
    }

    addClickEvent() {
        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('note')) {
                const columnIndex = parseInt(e.target.parentElement.className.replace(/\D/g, ""));
                const barIndex = parseInt(e.target.parentElement.parentElement.className.replace(/\D/g, ""));
                const notes = e.target.parentElement.children;
                let noteValue = e.target.classList[1];

                play(noteValue, isAccent);

                // Update the specific bar and column data
                let currentNoteData = this.data[barIndex][columnIndex];
                currentNoteData.note = noteValue;
                currentNoteData.isAccent = isAccent;

                if (isAccent && e.target.classList.contains('accent')) {
                    e.target.classList.remove('accent');
                    currentNoteData.note = '';
                    currentNoteData.isAccent = false;
                } else if (!isAccent && e.target.classList.contains('active')) {
                    e.target.classList.remove('active');
                    currentNoteData.note = '';
                    currentNoteData.isAccent = false;
                } else {
                    Array.from(notes).forEach(note => note.classList.remove('active', 'accent'));
                    e.target.classList.add(isAccent ? 'accent' : 'active');
                }
                this.getColourFromData()
            }
            if (e.target.classList.contains('colour')) {
                let index = Number(e.target.classList[1].match(/\d+/g)[0])
                this.colours[index] = paintColour
                this.displayColour()
                this.getDataFromColour()
            }
        });
    }

    getDataFromColour() {
        for (let i =0; i < this.colours.length; i++) {
            let barBinary = hexToBinary(this.colours[i])
            for (let j=0; j < barBinary.length; j++) {
                let note = binaryToNote(barBinary[j])
                if (note.includes("'")) {
                    this.data[i][j].isAccent = true
                } else {
                    this.data[i][j].isAccent = false
                }
                //if (note.includes("~")) {}
                this.data[i][j].note = note.replace(/['~]/g, "")
            }
        }
        this.displayMidi()
    }

    displayMidi() {
        const editor = document.querySelector('.editor');
        for (let i=0; i < editor.children.length; i++) {
            for (let j=0; j < editor.children[i].children.length; j++) {
                //console.log(editor.children[i].children[j].children)
                for (let k=0; k < editor.children[i].children[j].children.length; k++) {
                    editor.children[i].children[j].children[k].classList.remove('active')
                    editor.children[i].children[j].children[k].classList.remove('accent')
                }
                if (this.data[i][j].note !== "") {
                    if (!this.data[i][j].isAccent) {
                        editor.children[i].children[j].querySelector('.' + this.data[i][j].note).classList.add('active')
                    } else {
                        editor.children[i].children[j].querySelector('.' + this.data[i][j].note).classList.add('accent')
                    }
                }
            }
        }
    }

    getColourFromData() {
        for (let i = 0; i < this.bars; i++) {
            let output = ""
            this.data[i].forEach(column => {
                let outputNote = column.note
                if (column.isAccent) {
                    outputNote += "'"
                }
                output += noteToBinary(outputNote)
            })
            this.colours[i] = binaryToHex(output)
        }
        this.displayColour()
    }

    displayColour() {
        for (let i = 0; i < this.bars; i++) {
            document.querySelector(`.colour-${i}`).style.background = `#${this.colours[i]}`;
        }
    }

    drawCSS() {
        const cssRoot = document.querySelector('#cssRoot');
        cssRoot.innerHTML = `:root {--bar-width: ${project.barWidth}px; --notes: ${this.scale.length}} ${this.getScaleCSS()}`;
    }

    getScaleCSS() {
        const scale = getScale();
        return scale.map(note => `.${note}`).join(', ') + '{background: #eeeeee}';
    }

    playBack() {
        const playColumn = (barIndex, columnIndex) => {
            if (barIndex >= this.data.length) return; // End condition
    
            const bar = this.data[barIndex];
            if (columnIndex >= bar.length) {
                playColumn(barIndex + 1, 0);
                return;
            }
    
            const column = bar[columnIndex];
            if (column.note !== '') {
                play(column.note, column.isAccent, this.noteLenhth);
            }
    
            setTimeout(() => {
                // Move to the next column
                playColumn(barIndex, columnIndex + 1);
            }, this.noteLengthMs);
        };
    
        playColumn(0, 0); // Start at the first bar and first column
    }
    
}


const audioCtx = new AudioContext();

function play(noteValue, noteAccent, noteDuration = 0.125) {
    const oscillator = audioCtx.createOscillator();
    const envelope = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter()
    
    // FX stack
    oscillator.connect(envelope);
    envelope.connect(filter);
    filter.connect(audioCtx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = parseFloat(getFrenquency(noteValue));

    // Define the ADSR parameters
    const attackTime = 0.1;  // Time to reach full volume
    const decayTime = 0.3;   // Time to reach sustain level
    const sustainLevel = 0.5; // Sustain volume level (0 to 1)
    const releaseTime = 0.1;  // Time to fade out after note is stopped

    const now = audioCtx.currentTime;

    // Filter and Envelope setup
    // filter.Q.value = isAccent ? 10 : 0.1;
    filter.Q.value = noteAccent ? 10 : 0.1;


    // Attack
    filter.frequency.setValueAtTime(0, now);
    envelope.gain.setValueAtTime(0, now);

    filter.frequency.linearRampToValueAtTime(2000, now + attackTime);
    envelope.gain.linearRampToValueAtTime(1, now + attackTime);

    // Decay
    filter.frequency.linearRampToValueAtTime(200, now + attackTime + decayTime);
    envelope.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

    // Start the oscillator
    oscillator.start(now);

    // Stop after note duration and apply release
    oscillator.stop(now + noteDuration + releaseTime);

    // Release
    envelope.gain.setValueAtTime(sustainLevel, now + noteDuration);
    filter.frequency.setValueAtTime(200, now + noteDuration);
    envelope.gain.linearRampToValueAtTime(0, now + noteDuration + releaseTime);
}