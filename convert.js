const inputElement = document.getElementById("fileInput");
const outputArea = document.getElementById("output");
const fileNameArea = document.getElementById("fileName");

function getFile() {
  document.getElementById("fileInput").click();
}

function dragOverHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

function dropHandler(ev) {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
    var files = [];
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                files.push(ev.dataTransfer.items[i].getAsFile());
            };
        };
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        files.push(ev.dataTransfer.files[i]);
        };
    };
    if (files.length > 0) {
        loadFile(files[0]);
    };
}

function download() {
    const link = document.createElement('a');
    link.href = "https://github.com/cabalex/fnf-song-converter/wiki/Making-and-Importing-New-Songs#step-3--importing-your-song-map"
    link.text = "Not sure where to go next? Click here!"
    outputArea.appendChild(link);
}

inputElement.onchange = (e) => {
  loadFile(inputElement.files[0]);
}

function loadFile(file) {
  if (!file) return;

  if (!file.name.endsWith('.json')) {
    alert("Enter a JSON file, silly!\nClick 'Save' in the beatmap editor and use that file.");
    return
  }
  
  fileNameArea.innerHTML = file.name;
  let reader = new FileReader();

  reader.onload = (e) => {
    // Handle dropdown - "modulo", "ignore", "expanded"
    noteHandlingOption = document.getElementById("noteHandlingSelector").value

    const json = JSON.parse(
        e.target.result.replace(/^\0+/, '').replace(/\0+$/, '') // sometimes has \x00 at the end
    );

    // display bpm and speed, reset output area
    var outputString = '';
    outputArea.innerHTML = '';
    const outputTextInitial = document.createElement("h3");
    outputTextInitial.style = "text-align: center; display: block;"
    outputTextInitial.innerHTML = `${json.song.song} | ${json.song.bpm} BPM | SPEED ${parseFloat(json.song.speed).toFixed(2)}`
    outputArea.appendChild(outputTextInitial);

    const bpm = json.song.bpm;
    const scratchList = [];
    const notesList = {};
    const sectionList = {};
    var beginsection_timing = 0;

    function addToNotesList(timing, value) {
        if (!notesList[timing]) {
            notesList[timing] = [value];
        } else {
            notesList[timing].push(value);
        }
    }

    for (i = 0; i < json.song.notes.length; i++) {
        // sections
        const section = json.song.notes[i];

        if (section.mustHitSection == false) {
            var assignment = [0, 1, 2, 3, 4, 5, 6, 7];
            sectionList[beginsection_timing.toString()] = "0" 
        } else {
            var assignment = [4, 5, 6, 7, 0, 1, 2, 3];
            sectionList[beginsection_timing.toString()] = "1"
        }

        beginsection_timing += ((60 / bpm) * 4) / 16 * section.lengthInSteps * 1000;

        // notes
        for (x = 0; x < section.sectionNotes.length; x++) {
            let note = section.sectionNotes[x];
            let timing = note[0].toFixed(4).padStart(12, '0')

            if (note[0].toString().split(".").length == 1) {
                timing = note[0].toString().padStart(7, '0')
            }

            switch(noteHandlingOption) {
                case "modulo":
                    // truncates modified notes (e.g. hurt notes)
                    if (note.length == 3) {
                        addToNotesList(timing, `${assignment[note[1]%8]}_${note[2]}`);
                    }
                    break;
                case "ignore":
                    // note modifiers are often index 3 (length 4)
                    if (note[1] < 8 && note.length == 3) {
                        addToNotesList(timing, `${assignment[note[1]]}_${note[2]}`);
                    }
                    break;
                case "expanded_truncate":
                    addToNotesList(timing, `${Math.floor(note[1]/8)*8 + assignment[note[1]%8]}_${note[2]}`);
                    break;
                case "expanded_unmodified_truncate":
                    if (note[1] < 8) {
                        addToNotesList(timing, `${assignment[note[1]]}_${note[2]}`);
                    } else {
                        addToNotesList(timing, `${note[1]}_${note[2]}`);
                    }
                    break;
                case "expanded":
                    addToNotesList(timing, `${Math.floor(note[1]/8)*8 + assignment[note[1]%8]}_${note.slice(2).join('_')}`);
                    break;
                case "expanded_unmodified":
                    if (note[1] < 8) {
                        addToNotesList(timing, `${assignment[note[1]]}_${note.slice(2).join('_')}`);
                    } else {
                        addToNotesList(timing, note.slice(1).join('_'));
                    }
                    break;
            }
        }
    }

    // we need to do these shenanigans due to the way sections can be formatted; sometimes all notes are grouped in one giant section

    lookupArray = Object.keys(notesList); // get note timings

    lookupArray = lookupArray.concat(Object.keys(sectionList)) // concat with section timings

    lookupArray = [...new Set(lookupArray)]; // remove duplicates

    lookupArray.sort((a,b) => Number(a)-Number(b)) // sort

    for (var i = 0; i < lookupArray.length; i++) {
        // if a valid section is at this lookup, add it to the scratch list
        if (Object.keys(sectionList).includes(lookupArray[i])) {
            scratchList.push(`#${sectionList[lookupArray[i]]}-${lookupArray[i]}`)
        }

        // if a valid note is at this lookup, add it to the scratch list
        if (Object.keys(notesList).includes(lookupArray[i])) {
            for (var x = 0; x < notesList[lookupArray[i]].length; x++) {
                scratchList.push(`?${lookupArray[i]}_${notesList[lookupArray[i]][x]}`)
            }
        }
    }

    // Create download link for outputted text file
    const blob = new Blob([scratchList.join("\n")], {type : 'text/plain'});
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    if (outputArea.style.display === "none") {
        outputArea.style.display = "block"
    }

    link.href = url;
    link.innerText = 'Download';
    link.download = file.name.split(".")[0] + ".txt";
    link.id = "download";
    link.addEventListener('click', function(){download()}, false);
    outputArea.appendChild(link);
  }

  reader.onerror = (e) => {
    const error = e.target.error;
    console.error(`Error occured while reading ${file.name}`, error);
  }

  reader.readAsText(file);
}
