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
    const img1 = document.createElement('img');
    const img2 = document.createElement('img');
    img1.src = "https://i.imgur.com/ixCIQvH.png";
    img2.src = "https://i.imgur.com/jye1Urg.png";
    outputArea.appendChild(img1);
    outputArea.appendChild(img2);
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
  const reader = new FileReader();
  reader.onload = (e) => {
    // e.target points to the reader
    var loadableFile = e.target.result.replace(/^\0+/, '').replace(/\0+$/, ''); // my data has weird 0x00 bytes at the end, so im lazy and doing this
    var json = JSON.parse(loadableFile);
    var outputString = '';
    outputArea.innerHTML = '';
    const outputTextInitial = document.createElement("h3");
    outputTextInitial.style = "text-align: center; display: block;"
    outputTextInitial.innerHTML = `${json.song.song} | ${json.song.bpm} BPM | SPEED ${parseFloat(json.song.speed).toFixed(2)}`
    outputArea.appendChild(outputTextInitial);
    const bpm = json.song.bpm
    var scratchList = [];
    var notesList = {};
    var sectionList = {};
    var beginsection_timing = 0;
    for (i = 0; i < json.song.notes.length; i++) {
        // sections
        var section = json.song.notes[i];
        var assignment = [4, 5, 6, 7, 0, 1, 2, 3];
        if (section.mustHitSection == false) {
            assignment = [0, 1, 2, 3, 4, 5, 6, 7];
            sectionList[beginsection_timing.toString()] = "0" 
        } else {
            sectionList[beginsection_timing.toString()] = "1"
        }
        beginsection_timing += ((60 / bpm) * 4) / 16 * section.lengthInSteps * 1000;
        // notes
        var notelist = [];
        for (x = 0; x < section.sectionNotes.length; x++) {
            var note = section.sectionNotes[x];
            if (note[0].toString().split(".").length == 1) {
                notesList[note[0].toString().padStart(7, '0')] = `${assignment[note[1]]}_${note[2]}`;
            } else {
                notesList[note[0].toFixed(4).padStart(12, '0')] = `${assignment[note[1]]}_${note[2]}`;
            }
        }
    }
    lookupArray = Object.keys(notesList);
    lookupArray = lookupArray.concat(Object.keys(sectionList))
    lookupArray = [...new Set(lookupArray)]; // remove duplicates
    lookupArray.sort((a,b) => Number(a)-Number(b)) // sort
    for (var i = 0; i < lookupArray.length; i++) {
        if (Object.keys(sectionList).includes(lookupArray[i])) {
            scratchList.push(`#${sectionList[lookupArray[i]]}-${lookupArray[i]}`)
        }
        if (Object.keys(notesList).includes(lookupArray[i])) {
            scratchList.push(`?${lookupArray[i]}_${notesList[lookupArray[i]]}`)
        }
    }
    
    var outputString = scratchList.join("\n");
    const blob = new Blob([outputString], {type : 'text/plain'});
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
