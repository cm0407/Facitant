# CLAUDE.md

Facitant: Collins's TCSS 490 (Autumn 2026) Artifact 2, a web app for Collins's course facilitator role at UW Tacoma. Version 1 shuffles students into groups and draws a seating chart. Planned next: attendance records and emails. When it's done, the Artifact 2 card in `../Portfolio/cards.js` links here.

Repo: https://github.com/cm0407/Facitant (planned) · Live: https://cm0407.github.io/Facitant/ (once Pages is on)

## Working with Collins

- **Teach, don't just do.** Explain in plain language, as a teacher would: the big picture first, then the detail, and define each new term the first time. Give git commands (`git commit` / `git push`) for Collins to run instead of running them, unless asked.
- **Don't write personal content.** Reflections in `NOTES.md` and portfolio card text must be Collins's own words. Draft the factual parts and mark the rest **[YOUR TURN]**.
- **Windows machine.** Give PowerShell commands. Use `python`, not `python3`.
- **Keep the log.** After each working session, add an entry to `NOTES.md`: what was asked, what was decided, what was abandoned.

## Structure

- `index.html` — header, the three control panels (Students, Who's here, Groups), and the seating chart area; loads Inter and JetBrains Mono, then PapaParse and mammoth from cdnjs with integrity hashes
- `css/style.css` — the portfolio's theme variables and graph-paper background, plus app layout; `body.presenting` rules make the projector view
- `js/roster.js` — `readRosterFile(file)` and `namesFromText(text)`: CSV header detection, "Last, First" flipping, filters for emails, IDs, and Canvas extras
- `js/groups.js` — `planGroupSizes`, `describeSizes`, `shuffle` (Fisher–Yates), `makeGroups`; no DOM access
- `js/seating.js` — `renderSeatingChart(container, groups, options)`; round tables up to 6 seats, long tables above that
- `js/app.js` — `state`, saved to localStorage under `facitant:v1`; event wiring; must load last
- `samples/sample-roster.csv` — made-up names for testing
- `table-shuffle.html` — the original one-file prototype, kept for reference

These are classic scripts sharing global functions, not ES modules, so the page still works when `index.html` is opened straight from disk. Every top-level name must be unique across the four files.

## Student privacy (FERPA)

- No real student names anywhere in the repo: code, docs, commits, or screenshots. Test with `samples/sample-roster.csv`.
- Names stay in the browser. Don't add anything that sends them to a server or third-party service without discussing it with Collins first.
- `.gitignore` ignores roster file types; `samples/*.csv` is the only exception.
- Put names on the page with `textContent`, never `innerHTML`, since they come from uploaded files.

## Run and deploy

- Local: open `index.html`, or `python -m http.server 8000` from this folder and go to http://localhost:8000
- Deploy: push to `main`; GitHub Pages serves the repo root.

## Constraints

- Front end only for now. The Artifact 2 requirements haven't been checked yet; confirm them before adding a back end.
- Public repo and site: no secrets, no student data.
- GitHub Pages paths are case-sensitive even though Windows isn't, so keep filenames and paths matching exactly.
- If a CDN library version changes, recompute its `integrity` hash, or the browser will refuse to load it.
