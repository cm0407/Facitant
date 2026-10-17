// Connects everything: remembers the app's state, saves it in this browser,
// and redraws the page whenever you type, upload, click, or shuffle.
// It uses functions from roster.js, groups.js, and seating.js, so those files
// must load before this one (see the <script> tags in index.html).

const STORAGE_KEY = "facitant:v1";

// The page elements this file reads from or updates, looked up once
const ui = {
  dropZone: document.getElementById("drop-zone"),
  fileInput: document.getElementById("file-input"),
  names: document.getElementById("names"),
  loadMessage: document.getElementById("load-message"),
  attendancePanel: document.getElementById("attendance-panel"),
  roster: document.getElementById("roster"),
  presentCount: document.getElementById("present-count"),
  markAll: document.getElementById("mark-all"),
  clearRoster: document.getElementById("clear-roster"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  leftoverButtons: document.querySelectorAll("[data-leftover]"),
  leftoverOptions: document.getElementById("leftover-options"),
  minus: document.getElementById("minus"),
  plus: document.getElementById("plus"),
  nOutput: document.getElementById("n-output"),
  unit: document.getElementById("unit"),
  preview: document.getElementById("preview"),
  shuffle: document.getElementById("shuffle"),
  roomTitle: document.getElementById("room-title"),
  roomTools: document.getElementById("room-tools"),
  reshuffle: document.getElementById("reshuffle"),
  present: document.getElementById("present"),
  exitPresent: document.getElementById("exit-present"),
  staleNotice: document.getElementById("stale-notice"),
  swapHint: document.getElementById("swap-hint"),
  tables: document.getElementById("tables"),
  exportBox: document.getElementById("export"),
  exportText: document.getElementById("export-text"),
  copy: document.getElementById("copy"),
  copyMessage: document.getElementById("copy-message"),
  announcer: document.getElementById("announcer"),
};

// Everything the app needs to remember between visits
let state = {
  rosterText: "", // the names box, exactly as typed or loaded
  absent: [], // names unchecked under "Who's here"
  mode: "size", // "size" = n people per group, "count" = n groups
  n: 4,
  leftover: "bigger", // what to do when students don't divide evenly
  groups: [], // the seating chart: a list of tables, each a list of names
  groupedFrom: [], // who was here at the last shuffle, to notice changes
};

// The first seat clicked when swapping two people, as { group, seat }
let selectedSeat = null;

// ---------- Saving ----------

// localStorage is a small storage box inside this browser on this computer.
// Nothing in it is sent anywhere, which keeps student names private.
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be blocked (some private windows). The app still works;
    // it just won't remember anything after a refresh.
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = { ...state, ...JSON.parse(saved) };
    }
  } catch {
    // Same as above: start fresh if storage can't be read
  }
}

// ---------- Roster and attendance ----------

function allNames() {
  return namesFromText(state.rosterText);
}

function presentNames() {
  return allNames().filter((name) => !state.absent.includes(name));
}

// True if two lists hold the same names, in any order
function sameNames(a, b) {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}

// Builds the "Who's here" checklist: one checkbox per student
function renderRoster() {
  const names = allNames();
  // Forget absences for names that were deleted from the list
  state.absent = state.absent.filter((name) => names.includes(name));
  ui.attendancePanel.hidden = names.length === 0;
  ui.roster.innerHTML = "";

  for (const name of names) {
    const row = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !state.absent.includes(name);
    const text = document.createElement("span");
    text.textContent = name;
    row.classList.toggle("absent", !checkbox.checked);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.absent = state.absent.filter((a) => a !== name);
      } else {
        state.absent.push(name);
      }
      row.classList.toggle("absent", !checkbox.checked);
      saveState();
      updateControls();
    });

    row.append(checkbox, text);
    ui.roster.append(row);
  }
  updateControls();
}

// Reads an uploaded file and puts its names in the names box
async function loadFile(file) {
  if (!ROSTER_FILE_TYPES.includes(fileExtension(file.name))) {
    ui.loadMessage.textContent =
      "Facitant reads CSV, TXT, and Word (.docx) files. For Excel or Google Sheets, use File → Download → CSV.";
    return;
  }

  ui.loadMessage.textContent = `Reading ${file.name}…`;
  let names;
  try {
    names = await readRosterFile(file);
  } catch (error) {
    // The full error goes to the browser's console (F12) for debugging
    console.error(error);
    ui.loadMessage.textContent = `Couldn't read ${file.name}. Save it as CSV or plain text, or copy the names into the box above.`;
    return;
  }

  if (names.length === 0) {
    ui.loadMessage.textContent = `No names found in ${file.name}. Check that it has one student per line or row.`;
    return;
  }

  state.rosterText = names.join("\n");
  state.absent = [];
  ui.names.value = state.rosterText;
  ui.loadMessage.textContent = `Loaded ${names.length} names from ${file.name}. Fix anything that looks off in the box above.`;
  saveState();
  renderRoster();
}

// ---------- Group settings ----------

// The smallest number the stepper allows: groups of 1 would be pointless
function minimumN() {
  return state.mode === "size" ? 2 : 1;
}

// Refreshes every number, button, and message that depends on the roster
// or the group settings
function updateControls() {
  const total = allNames().length;
  const here = presentNames().length;
  ui.presentCount.textContent = `${here} of ${total} here`;

  ui.nOutput.textContent = state.n;
  if (state.mode === "size") {
    ui.unit.textContent = "per group";
  } else {
    ui.unit.textContent = state.n === 1 ? "group" : "groups";
  }
  ui.leftoverOptions.hidden = state.mode !== "size";
  ui.modeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.mode === state.mode);
  });
  ui.leftoverButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.leftover === state.leftover);
  });

  if (here > 0) {
    const sizes = planGroupSizes(here, state);
    ui.preview.textContent = `${here} ${here === 1 ? "student" : "students"} → ${describeSizes(sizes)}`;
  } else {
    ui.preview.textContent = "Add students to see how the groups will split.";
  }
  ui.shuffle.disabled = here === 0;

  // Warn if anyone was added, removed, or marked absent since the last shuffle
  const changed = state.groups.length > 0 && !sameNames(state.groupedFrom, presentNames());
  ui.staleNotice.hidden = !changed;
}

// ---------- Seating chart ----------

function renderChart(animate = false) {
  const hasGroups = state.groups.length > 0;
  ui.roomTools.hidden = !hasGroups;
  ui.exportBox.hidden = !hasGroups;
  ui.swapHint.hidden = !hasGroups;
  ui.roomTitle.textContent = document.body.classList.contains("presenting")
    ? "Find your table"
    : "Seating chart";

  if (!hasGroups) {
    ui.tables.className = "";
    ui.tables.innerHTML = `
      <div class="empty">
        <div>
          <div class="ghost" aria-hidden="true">?</div>
          <strong>No tables yet</strong>
          <p>Upload or paste your class list, pick a group size, then shuffle.</p>
        </div>
      </div>`;
    return;
  }

  renderSeatingChart(ui.tables, state.groups, {
    selected: selectedSeat,
    onSeatClick: handleSeatClick,
    animate,
  });
  ui.exportText.value = state.groups
    .map((group, i) => `Table ${i + 1}: ${group.join(", ")}`)
    .join("\n");
}

function shuffleIntoGroups() {
  const names = presentNames();
  if (names.length === 0) {
    return;
  }
  state.groups = makeGroups(names, state);
  state.groupedFrom = names;
  selectedSeat = null;
  saveState();
  renderChart(true);
  updateControls();
  const sizes = state.groups.map((group) => group.length);
  ui.announcer.textContent = `Shuffled ${names.length} students into ${describeSizes(sizes)}.`;
}

// Swapping takes two clicks: the first picks a student, the second picks who
// they trade places with. Clicking the same student again cancels.
function handleSeatClick(group, seat) {
  if (!selectedSeat) {
    selectedSeat = { group, seat };
    ui.announcer.textContent = `${state.groups[group][seat]} selected. Choose someone to swap with.`;
  } else if (selectedSeat.group === group && selectedSeat.seat === seat) {
    selectedSeat = null;
    ui.announcer.textContent = "Selection cleared.";
  } else {
    const first = state.groups[selectedSeat.group][selectedSeat.seat];
    const second = state.groups[group][seat];
    state.groups[selectedSeat.group][selectedSeat.seat] = second;
    state.groups[group][seat] = first;
    selectedSeat = null;
    saveState();
    ui.announcer.textContent = `Swapped ${first} and ${second}.`;
  }
  renderChart();
  // Redrawing replaces every seat button, so put keyboard focus back on the
  // seat that was just clicked
  ui.tables.querySelector(`[data-group="${group}"][data-seat="${seat}"]`)?.focus();
}

// Projector view hides everything but the chart and makes names bigger
function setPresenting(on) {
  document.body.classList.toggle("presenting", on);
  renderChart();
  window.scrollTo(0, 0);
}

async function copyGroups() {
  try {
    await navigator.clipboard.writeText(ui.exportText.value);
    ui.copyMessage.textContent = " Copied.";
  } catch {
    // Some browsers block the clipboard (for example on file:// pages).
    // Selecting the text lets Ctrl+C do the job instead.
    ui.exportText.focus();
    ui.exportText.select();
    ui.copyMessage.textContent = " Text selected. Press Ctrl+C to copy.";
  }
}

// ---------- Events: what happens when you click, type, or drop ----------

ui.fileInput.addEventListener("change", () => {
  if (ui.fileInput.files[0]) {
    loadFile(ui.fileInput.files[0]);
  }
  // Clearing the input lets you upload the same file again later
  ui.fileInput.value = "";
});

for (const type of ["dragenter", "dragover"]) {
  ui.dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    ui.dropZone.classList.add("over");
  });
}
for (const type of ["dragleave", "drop"]) {
  ui.dropZone.addEventListener(type, () => ui.dropZone.classList.remove("over"));
}
ui.dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) {
    loadFile(file);
  }
});
// Dropping a file anywhere else would make the browser open it and leave the app
window.addEventListener("dragover", (event) => event.preventDefault());
window.addEventListener("drop", (event) => event.preventDefault());

ui.names.addEventListener("input", () => {
  state.rosterText = ui.names.value;
  ui.loadMessage.textContent = "";
  saveState();
  renderRoster();
});

ui.markAll.addEventListener("click", () => {
  state.absent = [];
  saveState();
  renderRoster();
});

ui.clearRoster.addEventListener("click", () => {
  if (!confirm("Clear the whole roster and the current groups?")) {
    return;
  }
  state.rosterText = "";
  state.absent = [];
  state.groups = [];
  state.groupedFrom = [];
  selectedSeat = null;
  ui.names.value = "";
  saveState();
  renderRoster();
  renderChart();
});

ui.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    state.n = Math.max(state.n, minimumN());
    saveState();
    updateControls();
  });
});

ui.leftoverButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.leftover = button.dataset.leftover;
    saveState();
    updateControls();
  });
});

ui.minus.addEventListener("click", () => {
  state.n = Math.max(minimumN(), state.n - 1);
  saveState();
  updateControls();
});

ui.plus.addEventListener("click", () => {
  state.n = Math.min(40, state.n + 1);
  saveState();
  updateControls();
});

ui.shuffle.addEventListener("click", () => {
  shuffleIntoGroups();
  // On a phone the chart is below the controls, so scroll down to it
  if (window.innerWidth <= 860) {
    document.querySelector(".room").scrollIntoView({ behavior: "smooth" });
  }
});

ui.reshuffle.addEventListener("click", shuffleIntoGroups);
ui.present.addEventListener("click", () => setPresenting(true));
ui.exitPresent.addEventListener("click", () => setPresenting(false));
ui.copy.addEventListener("click", copyGroups);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (document.body.classList.contains("presenting")) {
    setPresenting(false);
  } else if (selectedSeat) {
    selectedSeat = null;
    renderChart();
  }
});

// ---------- Start up ----------

loadState();
ui.names.value = state.rosterText;
renderRoster();
renderChart();
