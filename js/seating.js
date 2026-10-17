// Draws the seating chart: one table per group, with each student's name in
// a seat around it.

// One color per table, cycling if there are more than 10 groups.
// Bright tones that stand out on the dark green background.
const TABLE_COLORS = [
  "#4ade80",
  "#2dd4bf",
  "#60a5fa",
  "#facc15",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
  "#a3e635",
  "#38bdf8",
  "#f87171",
];

// Up to 6 names fit around a round table before they start to overlap.
// Bigger groups sit at a long table instead.
const MAX_ROUND_SEATS = 6;

// Draws every group into the container element.
//   selected     the seat picked for a swap, as { group, seat }, or null
//   onSeatClick  called with (groupIndex, seatIndex) when a seat is clicked
//   animate      true right after a shuffle, so the seats "deal" in one by one
function renderSeatingChart(container, groups, { selected, onSeatClick, animate }) {
  container.innerHTML = "";
  container.className = animate ? "tables dealing" : "tables";
  let dealOrder = 0;

  groups.forEach((group, g) => {
    const isRound = group.length <= MAX_ROUND_SEATS;
    const table = document.createElement("div");
    table.className = isRound ? "table round" : "table long";
    table.style.setProperty("--c", TABLE_COLORS[g % TABLE_COLORS.length]);
    table.setAttribute("role", "group");
    table.setAttribute("aria-label", `Table ${g + 1}: ${group.join(", ")}`);

    const top = document.createElement("div");
    top.className = "table-top";
    top.innerHTML = `<b>${g + 1}</b><small>${group.length} ${group.length === 1 ? "seat" : "seats"}</small>`;

    const seats = group.map((name, s) => {
      const seat = document.createElement("button");
      seat.type = "button";
      seat.className = "seat";
      if (selected && selected.group === g && selected.seat === s) {
        seat.classList.add("selected");
      }
      // textContent (not innerHTML) shows a name as plain text, even if an
      // uploaded file has something like <b> in it
      seat.textContent = name;
      seat.title = name;
      seat.dataset.group = g;
      seat.dataset.seat = s;
      seat.style.setProperty("--delay", `${dealOrder++ * 35}ms`);
      seat.addEventListener("click", () => onSeatClick(g, s));
      return seat;
    });

    if (isRound) {
      placeAroundCircle(seats);
      table.append(top, ...seats);
    } else {
      // Half the seats along the top edge, the rest along the bottom
      const half = Math.ceil(seats.length / 2);
      table.append(makeSide(seats.slice(0, half)), top, makeSide(seats.slice(half)));
    }
    container.append(table);
  });
}

// Spreads seats evenly around a circle, starting at 12 o'clock.
// Seat k of n sits at angle θ = 360° · k / n. A point on a circle of radius r
// is (r·cos θ, r·sin θ), so those become the seat's left and top, measured
// in percent from the table's center.
function placeAroundCircle(seats) {
  const radius = 36; // the tabletop's radius is 16, so seats clear it
  seats.forEach((seat, k) => {
    const angle = ((-90 + (360 * k) / seats.length) * Math.PI) / 180;
    seat.style.left = `${50 + radius * Math.cos(angle)}%`;
    seat.style.top = `${50 + radius * Math.sin(angle)}%`;
  });
}

// One side of a long table: a row of seats
function makeSide(seats) {
  const side = document.createElement("div");
  side.className = "side";
  side.append(...seats);
  return side;
}
