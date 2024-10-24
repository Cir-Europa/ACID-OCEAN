function initBPM(value) {
    bpm = value
    noteLengthMs = (60000 / bpm) / 4
    noteLengthS = ((60000 / bpm) / 4) / 1000
}

// PROJECT
let bpm = 135
let noteLengthMs = (60000 / bpm) / 4
let noteLengthS = ((60000 / bpm) / 4) / 1000
const barWidth = 300
const tracks = [new Track]
//const scale = ["A3", "Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5"].reverse();

// CURSOR
let isAccent = false;
let isPortemento = false;
let isPaint = true;
let isEyeDropper = false;

let paintColour = "ff338a"
let trackSelection = 0

tracks.forEach(track => {
    track.initClipPreview()
})

initMidiEditor(tracks[trackSelection])

$('#tempo').on('click keyup', function(e) {
    initBPM(e.target.value)
})

$('#master').change(function(){
    masterVolume.gain.value = $('#master').val() / 100
})

function getPaintColour() {
    $('#color').val('#' + paintColour); // Set the color input value using .val()
    drawCSS();
}

$(document).ready(getPaintColour);

$('#color').change(function(e) {
    paintColour = e.target.value.substring(1)
    drawCSS()
    //updateURL()
})

$('#eyeDropper').click(function() {
    isEyeDropper = !isEyeDropper
    if (isEyeDropper) {
        $('.colours').addClass('drop')
        isPaint = false
    } else {
        $('.colours').removeClass('drop')
        isPaint = true
    }
})

function drawToggle() {
    isPortemento=false
    $('#draw').removeClass('pressed')
    $('#drawAccent').removeClass('pressed')
    $('#portemento').removeClass('pressed')
    if (isAccent) {
        $('#drawAccent').addClass('pressed')
    } else {
        $('#draw').addClass('pressed')
    }
}

$('#draw').click(function() {
    isAccent = false; 
    drawToggle()
})

$('#drawAccent').click(function() {
    isAccent = true; 
    drawToggle()
})

$('#portemento').click(function() {
    isPortemento = !isPortemento;
    $('#draw').removeClass('pressed')
    $('#drawAccent').removeClass('pressed')
    $('#portemento').toggleClass('pressed')
    if (!isPortemento) {
        if (isAccent) {
            $('#drawAccent').addClass('pressed')
        } else {
            $('#draw').addClass('pressed')
        }
    }
})

$('#playBack').click(function() {
    tracks[trackSelection].playBack()
})

let isExport = false

$('#export').click(function() {
    isExport = true
    ctx = new OfflineAudioContext(2, sampleRate * 40, sampleRate);
    tracks[trackSelection].playBack()
})

$('#zoomIn').click(function() {
    barWidth += 100
    tracks[trackSelection].drawCSS()
})

$('#zoomOut').click(function() {
    barWidth -= 100
    tracks[trackSelection].drawCSS()
})

// URL PARAMZ
/*
$(document).ready(function() {
    loadURL()
});*/