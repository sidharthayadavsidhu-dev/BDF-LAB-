// src/db/init.js
// Exported as ensureSchema() so src/index.js can call it on startup.
// Also works standalone:  npm run init-db

import db from "./database.js";

export async function ensureSchema() {
  // ── Create table if it doesn't exist ────────────────────────────────────────
  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      author     TEXT    NOT NULL,
      price      REAL    NOT NULL CHECK(price >= 0),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // ── Seed sample data only when the table is empty ────────────────────────────
  const row   = await db.get("SELECT COUNT(*) AS n FROM books");
  const count = row.n;

  if (count === 0) {
    const seeds = [
      ["The Pragmatic Programmer",   "David Thomas",      45.99],
      ["Clean Code",                  "Robert C. Martin",  39.99],
      ["You Don't Know JS",           "Kyle Simpson",      29.99],
      ["Eloquent JavaScript",         "Marijn Haverbeke",   0.00],
      ["Node.js Design Patterns",     "Mario Casciaro",    49.99],
      ["Learning Python",             "Mark Lutz",         55.00],
      ["JavaScript: The Good Parts",  "Douglas Crockford", 24.99],
      ["Introduction to Algorithms",  "Thomas H. Cormen",  89.99],
      ["The Clean Coder",             "Robert C. Martin",  34.99],
      ["Refactoring",                 "Martin Fowler",     47.00],
    ];

    for (const [title, author, price] of seeds) {
      await db.run(
        "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
        [title, author, price]
      );
    }
    console.log("✅  Database initialised with 10 seed books.");
  }
}

// Allow running directly:  node src/db/init.js
if (process.argv[1].endsWith("init.js")) {
  await ensureSchema();
  process.exit(0);
}
