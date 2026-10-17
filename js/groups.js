// The math behind the groups: how many to make, how big each one is, and a
// fair shuffle. Nothing here touches the page, so it's easy to test alone.

// Works out the size of every group, before deciding who goes where.
//   settings.mode      "size"  → n is the number of people per group
//                      "count" → n is the number of groups
//   settings.leftover  "bigger" or "smaller", for when people don't divide evenly
// Example: 23 students, 4 per group
//   bigger  → 23 ÷ 4 = 5 groups (rounded down) → [5, 5, 5, 4, 4]
//   smaller → 23 ÷ 4 = 6 groups (rounded up)   → [4, 4, 4, 4, 4, 3]
function planGroupSizes(total, settings) {
  if (total === 0) {
    return [];
  }

  let groupCount;
  if (settings.mode === "count") {
    groupCount = Math.min(settings.n, total);
  } else if (settings.leftover === "bigger") {
    groupCount = Math.max(1, Math.floor(total / settings.n));
  } else {
    groupCount = Math.ceil(total / settings.n);
  }

  // Share people out as evenly as possible: every group gets the base size,
  // and the remainder adds one extra person to each of the first few groups
  const base = Math.floor(total / groupCount);
  const remainder = total % groupCount;
  const sizes = [];
  for (let i = 0; i < groupCount; i++) {
    sizes.push(i < remainder ? base + 1 : base);
  }
  return sizes;
}

// Turns [5, 5, 4] into "2 groups of 5 and 1 group of 4"
function describeSizes(sizes) {
  const counts = new Map();
  for (const size of sizes) {
    counts.set(size, (counts.get(size) || 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[0] - a[0])
    .map(([size, count]) => `${count} ${count === 1 ? "group" : "groups"} of ${size}`)
    .join(" and ");
}

// Fisher–Yates shuffle: walk backward through the list, swapping each spot
// with a random spot at or before it. Every order is equally likely, which
// shortcuts like sorting by Math.random() can't promise.
function shuffle(list) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Shuffles the names, then deals them out like cards: one to group 1, one to
// group 2, and so on, looping around until everyone has a seat. Dealing this
// way gives exactly the sizes planGroupSizes worked out.
function makeGroups(names, settings) {
  const sizes = planGroupSizes(names.length, settings);
  const groups = sizes.map(() => []);
  shuffle(names).forEach((name, i) => groups[i % groups.length].push(name));
  return groups;
}
