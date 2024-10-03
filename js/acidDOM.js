const editor = document.querySelector('.editor')


function getScaleCSS() { 
    const scl = getScale();
    return scl.map(note => `.${note}`).join(', ') + '{background: #eeeeee}';
}

function drawCSS() { 
    const cssRoot = document.querySelector('#cssRoot');
    cssRoot.innerHTML = `:root {--bar-width: ${barWidth}px; --notes: ${scale.length}; --accent-color: #${paintColour}} ${getScaleCSS()};`;
}

function createBar(index) {
    const bar = document.createElement('div');
    bar.classList.add('bar', `bar-${index}`);
    return bar;
}

function createColumn(index) {
    const column = document.createElement('div');
    column.classList.add('column', `column-${index}`);
    return column;
}

function createNoteElement(noteValue) {
    const note = document.createElement('div');
    note.classList.add('note');
    if (noteValue !== '') {
        let noteNoOctave = noteValue.replace(/[0-9]/g, '');
        note.classList.add(noteValue, noteNoOctave);
    }
    return note;
}

function initMidiEditor(track) {
    let columnIndex = 0; // Initialize a single column index outside the loops
    for (let i = 0; i < track.bars; i++) {
        const bar = createBar(i);
        for (let j = 0; j < 4; j++) {
            const column = createColumn(columnIndex); // Use the continuous columnIndex
            scale.forEach(noteValue => {
                const note = createNoteElement(noteValue);
                column.appendChild(note);
            });
            bar.appendChild(column);
            columnIndex++; // Increment columnIndex for each column created
        }
        editor.appendChild(bar);
    }
    addClickEvent();
    drawCSS();
}

function addClickEvent() {
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('note')) {
            const columnIndex = parseInt(e.target.parentElement.className.replace(/\D/g, ""));
            const noteValue = e.target.classList[1];
            const data = tracks[trackSelection].data[columnIndex]

            if (data.note === noteValue && data.isAccent === isAccent && !isPortemento){
                data.note = ''
                data.isAccent = false
                data.isPortemento = false
            } else {
                if (isPortemento && data.note !== '') {
                    data.isPortemento = !data.isPortemento 
                } else if (isPortemento && data.note === '') {
                    return
                } else {
                    data.note = noteValue
                    data.isAccent = isAccent
                }
            }

            play(data.note || noteValue, isAccent, noteLengthS) 
            displayMidi()
            tracks[trackSelection].getColoursFromData()
        }
    }
)}

function displayMidi() { 
    let bars = editor.children
    for (let i=0; i < bars.length; i++) {
        for (let j=0; j < bars[i].children.length; j++) {
            let columns = bars[i].children;
            for (let k=0; k < columns[j].children.length; k++) {
                editor.children[i].children[j].children[k].classList.remove('active', 'accent', 'portemento')
                editor.children[i].children[j].children[k].classList.remove('accent')
            }
            if (tracks[trackSelection].data[i * 4 + j].note !== "") {
                if (!tracks[trackSelection].data[i * 4 + j].isAccent) {
                    columns[j].querySelector('.' + tracks[trackSelection].data[i * 4 + j].note).classList.add('active')
                } else {
                    columns[j].querySelector('.' + tracks[trackSelection].data[i * 4 + j].note).classList.add('accent')
                }
                if (tracks[trackSelection].data[i * 4 + j].isPortemento) {
                    columns[j].querySelector('.' + tracks[trackSelection].data[i * 4 + j].note).classList.add('portemento')
                }
            }
        }
    }
}