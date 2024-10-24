const scale = ["A3", "Bb3","B3","C4","Db4","D4","Eb4","E4","F4","Gb4","G4","Ab4","A4","Bb4","B4","C5"].reverse();

const binary = [
    "000000", "000001", "000010", "000011", "000100", "000101", "000110", "000111",
    "001000", "001001", "001010", "001011", "001100", "001101", "001110", "001111",
    "010000", "010001", "010010", "010011", "010100", "010101", "010110", "010111",
    "011000", "011001", "011010", "011011", "011100", "011101", "011110", "011111",
    "100000", "100001", "100010", "100011", "100100", "100101", "100110", "100111",
    "101000", "101001", "101010", "101011", "101100", "101101", "101110", "101111",
    "110000", "110001", "110010", "110011", "110100", "110101", "110110", "110111",
    "111000", "111001", "111010", "111011", "111100", "111101", "111110", "111111"
];

function generateNoteMappings(scale) {
    const binaryMap = {};
    const noteMap = {};
    let binaryIndex = 0;

    for (let i = 0; i < scale.length + 1; i++) {
        let note = scale[i - 1];
        let noteWithMarks;

        for (let j = 0; j <= 3; j++) {

            if (!note) {
                binaryIndex++
                break
            } else {
                noteWithMarks = note + (j === 1 ? "'" : j === 2 ? "~" : j === 3 ? "~'" : "");
            }

            binaryMap[binary[binaryIndex]? binary[binaryIndex]: "000000"] = noteWithMarks;
            noteMap[noteWithMarks] = binary[binaryIndex];

            binaryIndex++;
        }
    }

    binaryMap["000000"] = "";
    noteMap[""] = "000000";

    return { binaryMap, noteMap };
}

const { binaryMap, noteMap } = generateNoteMappings(scale.slice().reverse());

function binaryToNote(binary) {
    return binaryMap[binary] || "";
}

function noteToBinary(note) {
    return noteMap[note] || "000000";
}
