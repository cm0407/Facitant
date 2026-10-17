# Facitant

A facilitator's assistant, built for TCSS 490 at UW Tacoma (Autumn 2026, Artifact 2). Upload or paste a class list, check off who's here, and shuffle everyone into groups. The groups show up as a seating chart you can put on the projector.

**Live app:** https://cm0407.github.io/Facitant/ (once GitHub Pages is turned on)

## Built with

Plain HTML, CSS, and JavaScript, styled to match my [portfolio](https://cm0407.github.io/Software-Projects/). No framework, build step, or server. Two small libraries load from a CDN: [PapaParse](https://www.papaparse.com/) reads CSV files and [mammoth](https://github.com/mwilliamson/mammoth.js) reads Word files.

## Files

```
Facitant/
├── index.html            the page: header, controls, seating chart area
├── css/
│   └── style.css         the portfolio's dark green theme, plus the app layout
├── js/
│   ├── roster.js         turns files and pasted text into a list of names
│   ├── groups.js         the math: group sizes and a fair shuffle
│   ├── seating.js        draws the tables and seats
│   └── app.js            connects everything and saves your work in the browser
├── samples/
│   └── sample-roster.csv made-up names for testing
├── table-shuffle.html    the original one-file prototype
├── NOTES.md              build log: what I asked the AI for, what I decided, what I dropped
├── CLAUDE.md             project notes for Claude Code
└── .gitignore            keeps real rosters out of the repo
```

The scripts load in order: `roster.js`, `groups.js`, and `seating.js` first, then `app.js`, which uses functions from the other three.

## Run it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

Then go to http://localhost:8000. Try it with `samples/sample-roster.csv`.

## Using it

1. **Add students.** Upload a CSV, TXT, or Word file, drop it on the upload box, or paste names one per line.
   - From Google Docs: File → Download → Microsoft Word (.docx) or Plain text (.txt).
   - From Google Sheets: File → Download → Comma-separated values (.csv).
   - For CSVs, Facitant looks for "First name" + "Last name" columns or a "Name" / "Student" column. "Last, First" names are flipped to "First Last".
2. **Take attendance.** Uncheck anyone who isn't here under "Who's here."
3. **Pick the groups.** Choose people per group or number of groups, and what to do with leftovers.
4. **Shuffle.** Click a name and then another name to swap two students. "Show on projector" hides everything but the chart (press Esc to leave). "Groups as text" copies the groups to paste anywhere.

## Student privacy

Class lists are protected by FERPA, so Facitant never sends names anywhere:

- Files are read inside the browser. Nothing is uploaded to a server.
- Your roster and groups are saved in this browser's local storage, so they're still there after a refresh. "Clear roster" deletes them.
- `.gitignore` blocks roster files (`.csv`, `.txt`, `.docx`, …) from being committed, except the made-up sample.

Keep real class lists outside this folder, and don't put real names in screenshots or commits.

## How it was built

See [NOTES.md](NOTES.md) for the session-by-session log.
