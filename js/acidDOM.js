const editor = document.querySelector('.editor')


function getScaleCSS() { 
    const scl = getScale();
    return scl.map(note => `.${note}`).join(', ') + '{background: #eeeeee}';
}

// CREDIT: https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
const pSBC=(p,c0,c1,l)=>{
    let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
    if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
    if(!this.pSBCr)this.pSBCr=(d)=>{
        let n=d.length,x={};
        if(n>9){
            [r,g,b,a]=d=d.split(","),n=d.length;
            if(n<3||n>4)return null;
            x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
        }else{
            if(n==8||n==6||n<4)return null;
            if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
            d=i(d.slice(1),16);
            if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
            else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
        }return x};
    h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
    if(!f||!t)return null;
    if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
    else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
    a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
    if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
    else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

function drawCSS() { 
    const cssRoot = document.querySelector('#cssRoot');
    cssRoot.innerHTML = `:root {--bar-width: ${barWidth}px; --notes: ${scale.length}; --accent-color: #${paintColour}; --accent-color-dark: ${pSBC(-0.4, "#" + paintColour)}} ${getScaleCSS()};`;
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
        if (e.target.classList.contains('colour') && isPaint) {
            let index = Number(e.target.classList[1].match(/\d+/g)[0])
            tracks[trackSelection].colours[index] = paintColour
            tracks[trackSelection].displayColour()
            tracks[trackSelection].getDataFromColour()
        }
        if (e.target.classList.contains('colour') && isEyeDropper) {
            paintColour = e.target.attributes.colour.value;
            getPaintColour()
        }
        if (e.target.id !== "eyeDropper" && isEyeDropper) {
            isEyeDropper = false
            isPaint = true
            $('.colours').removeClass('drop')
        }
    }
)}