const inputElement = document.getElementById("fileInput");
const outputArea = document.getElementById("output");
const fileNameArea = document.getElementById("fileName");

function getFile() {
  document.getElementById("fileInput").click();
}

inputElement.onchange = (e) => {
  const file = inputElement.files[0]
  if (!file) return
  if (!file.name.endsWith('.json')) {
    alert("Enter a JSON file, silly!\nClick 'Save' in the beatmap editor and use that file.")
    return
  }
  fileNameArea.innerHTML = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    // e.target points to the reader
    var loadableFile = e.target.result.replace(/^\0+/, '').replace(/\0+$/, ''); // my data has weird 0x00 bytes at the end, so im lazy and doing this
    var json = JSON.parse(loadableFile);
    var outputString = ''
    outputArea.innerHTML = '';
    outputArea.appendChild(document.createTextNode(`Song name: ${json.song.song}`))
    outputArea.appendChild(document.createElement("br"));
    outputArea.appendChild(document.createTextNode(`Song BPM: ${json.song.bpm}`))
    const bpm = json.song.bpm
    outputArea.appendChild(document.createElement("br"));
    outputArea.appendChild(document.createTextNode(`Song speed: ${json.song.speed}x (may be useful for setting multipliers)`))
    var scratchList = []
    var beginsection_timing = 0
    for (i = 0; i < json.notes.length; i++) {
        section = json.notes[i]
        if (section.mustHitSection = false) {
            var assignment = [0, 1, 2, 3, 4, 5, 6, 7]
            scratchList.push(`#0-${beginsection_timing}`)
        } else {
            var assignment = [4, 5, 6, 7, 0, 1, 2, 3]
            scratchList.push(`#1-${beginsection_timing}`)
        }
        beginsection_timing += ((60 / bpm) * 4) / 16 * section.lengthInSteps * 1000
        var notelist = []
        for (x = 0; x < section.sectionNotes.length; x++) {
            var note = section.sectionNotes[x]
            if (note[0].toString().split(".").length = 1) {
                notelist.push(`?${note[0].toString().padStart(7, '0')}_${assignment[note[1]]}_${note[2]}`);
            } else {
                notelist.push(`?${note[0].toFixed(4).padStart(12, '0')}_${assignment[note[1]]}_${note[2]}`);
            }
        }
        notelist.sort();
        for (y = 0; y < notelist.length; y++) {
            scratchList.push(notelist[y])
        }
    }
    var outputString = scratchList.join("\n")
    const blob = new Blob([outputString], {type : 'text/plain'});
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.innerText = 'Download';
    link.download = "beatmap.txt"
    link.style = "font-weight: bold; background-color: #4d97ff; color: white; padding: 1em 1.25em; border: 0; border-radius: 0.25rem; margin: 0.5em; text-decoration: none;";
    outputArea.appendChild(link);
  }
  reader.onerror = (e) => {
    const error = e.target.error
    console.error(`Error occured while reading ${file.name}`, error)
  }
  reader.readAsText(file)
}