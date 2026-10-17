# Build Log: Facitant (Artifact 2)

## Goal

A web app for my course facilitator role at UW Tacoma. Version 1: upload or paste a class list, check off who's here, shuffle the students into groups of a size I pick, and show the groups as a seating chart I can put on the projector. Attendance records and emails come later.

Like the portfolio, it's plain HTML, CSS, and JavaScript with no server, so it can run on GitHub Pages.

## AI tools used

- Session 1: Claude Code

## Session 1: Oct 16

**Asked Claude Code for:**

1. A web app that helps me in my facilitator role: upload a Google Doc or CSV of student names, shuffle them into groups of a size I choose (3, 4, 5, …), and show the groups as a seating chart.
2. To start from my example file, `table-shuffle.html`, but keep the styling the same as my portfolio site.
3. To create the project structure and write all the files.
4. To teach me how to connect this folder to a GitHub repo and push.

**Decided:**

- Kept the features from `table-shuffle.html`: upload or paste, a "Who's here" checklist, people per group or number of groups, click two names to swap them, projector view, and copy as text. Restyled it with the portfolio's look: dark green gradient, graph-paper lines, JetBrains Mono and Inter, `//` before headings, and the terminal-style header.
- Split the prototype's single file into one file per job: `roster.js` reads names, `groups.js` does the math, `seating.js` draws the tables, `app.js` connects them. Attendance and email can become their own files later.
- Seats are placed around each round table with cos and sin, like points on the unit circle. Groups of 7 or more sit at a long table instead, because names start to overlap around a circle.
- For Google Docs, download the doc as .docx or .txt and upload that, or copy and paste the names. That keeps the roster private.
- Student privacy (FERPA): names never leave the browser. They're saved only in this browser's local storage, `.gitignore` blocks roster files from the repo, and the sample roster uses made-up names.
- Added integrity hashes to the two libraries that load from a CDN, so the browser rejects a copy that's been tampered with.
- Kept `table-shuffle.html` in the folder as the original prototype.

**Abandoned:**

- The prototype's light/dark switch, since the portfolio is dark only.
- Reading a Google Doc straight from its share link. That would need either a Google sign-in setup or a public link, and a public link would expose student names.

**What I learned:**

- **[YOUR TURN: what clicked or surprised you this session, e.g. about project structure, git remotes, or keeping student data private]**

## Next steps

- [ ] Push to GitHub and turn on GitHub Pages
- [ ] Test with a real class list on my own computer (keep the file outside this folder)
- [ ] Check the app against the Artifact 2 requirements
- [ ] Link the Portfolio's Artifact 2 card to the live app
- [ ] Next features: attendance records, emails
