// Turns what you give the app (a pasted list, a CSV, a text file, or a Word
// file downloaded from Google Docs) into a plain list of student names.

// The file types the upload box understands
const ROSTER_FILE_TYPES = ["csv", "tsv", "txt", "docx"];

// "Roster Fall.CSV" → "csv"
function fileExtension(fileName) {
  return fileName.split(".").pop().toLowerCase();
}

// Tidies one line: drops bullets ("•", "-") and numbers ("1.", "2)") from
// the front and squeezes repeated spaces, so " 3.  Ben   Liu " → "Ben Liu"
function cleanName(line) {
  return line
    .replace(/^\s*(?:[-*•·▪◦]|\d+[.)])\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Splits text into names, one per line, skipping blank lines
function namesFromText(text) {
  return text.split(/\r?\n/).map(cleanName).filter(Boolean);
}

// Canvas and many school rosters write "Last, First". Flip that to
// "First Last" so the seating chart reads naturally.
function flipLastFirst(name) {
  const parts = name.split(",");
  if (parts.length !== 2) {
    return name;
  }
  const last = parts[0].trim();
  const first = parts[1].trim();
  return last && first ? `${first} ${last}` : name;
}

// Filters out lines that can't be a student: emails, ID numbers, and the
// extra rows Canvas puts in gradebook exports
function looksLikeAStudent(name) {
  return (
    !name.includes("@") &&
    !/^[\d\s-]+$/.test(name) &&
    !/^(points possible|test student)$/i.test(name)
  );
}

// Finds the first column whose header matches the pattern. It skips columns
// like "Student ID" or "Email" that mention a student but don't hold a name.
function findColumn(header, pattern, skip = []) {
  return header.findIndex(
    (h, i) =>
      !skip.includes(i) &&
      pattern.test(h) &&
      !/\b(id|email|e-mail|login|number)\b|username|user name|#/.test(h),
  );
}

// Picks the names out of a spreadsheet's rows (from a CSV or Google Sheet).
// It reads the header row for "First name" + "Last name" columns, or a
// "Name" / "Student" column. With no header it recognizes, it takes the
// first filled-in cell of every row.
function namesFromRows(rows) {
  const cleanRows = rows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
  if (cleanRows.length === 0) {
    return [];
  }

  const header = cleanRows[0].map((cell) => cell.toLowerCase());
  const body = cleanRows.slice(1);
  const first = findColumn(header, /\b(first|given|preferred|fname)\b|first_?name/);
  const last = findColumn(header, /\b(last|surname|family|lname)\b|last_?name/);
  let full = findColumn(header, /name/, [first, last]);
  if (full === -1) {
    full = findColumn(header, /student|learner|participant/, [first, last]);
  }

  if (first > -1 && last > -1) {
    return body.map((row) => [row[first], row[last]].filter(Boolean).join(" "));
  }
  if (full > -1) {
    return body.map((row) => row[full] || "");
  }
  if (first > -1) {
    return body.map((row) => row[first] || "");
  }
  return cleanRows.map((row) => row.find(Boolean));
}

// Reads an uploaded roster file and returns the student names in it.
// It's "async" because reading a file takes a moment; the app waits for it.
async function readRosterFile(file) {
  const extension = fileExtension(file.name);
  let names;

  if (extension === "docx") {
    // A .docx file is a zipped bundle of XML, not plain text, so the mammoth
    // library unpacks it and hands back just the words
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    names = namesFromText(result.value);
  } else {
    const text = await file.text();
    // Tabs mean the text came from a spreadsheet, even in a .txt file
    if (extension === "csv" || extension === "tsv" || text.includes("\t")) {
      // PapaParse handles the tricky parts of CSV, like a comma inside
      // quotes ("Okafor, Amara") that isn't a column break
      names = namesFromRows(Papa.parse(text, { skipEmptyLines: true }).data);
    } else {
      names = namesFromText(text);
    }
  }

  return names
    .map(cleanName)
    .map(flipLastFirst)
    .filter(Boolean)
    .filter(looksLikeAStudent);
}
