// broken/server_fixed.js
// ════════════════════════════════════════════════════════════════════════════
//  DEBUGGING EXERCISE – REFERENCE SOLUTION
//  All four bugs have been corrected. Compare with broken/server.js.
// ════════════════════════════════════════════════════════════════════════════

import express from "express";

const app = express();
app.use(express.json());

// FIX 1 ── Free port (was 3000, conflicted with the main server)
const PORT = 3001;             // ✅  was 3000

// FIX 2 ── Correct import path ("datbase" → "database")
import db from "../src/db/database.js";  // ✅  was "../src/db/datbase.js"

// ── GET /books ────────────────────────────────────────────────────────────────
app.get("/books", async (req, res) => {
  try {
    // FIX 3 ── Correct table name ("book" → "books")
    const rows = await db.all("SELECT * FROM books"); // ✅  was "book"
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /books/:id ────────────────────────────────────────────────────────────
app.get("/books/:id", async (req, res) => {
  try {
    const book = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [req.params.id]
    );
    if (!book) return res.status(404).json({ message: "Not found." });
    res.json({ data: book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /books ───────────────────────────────────────────────────────────────
app.post("/books", async (req, res) => {
  const { title, author, price } = req.body;

  if (!title || !author || price === undefined) {
    return res
      .status(400)
      .json({ message: "title, author and price are required." });
  }

  try {
    // FIX 4 ── Added "await" so result resolves to { lastID, changes }
    const result = await db.run(                      // ✅  was db.run(...)
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [title, author, parseFloat(price)]
    );

    const newBook = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [result.lastID]
    );

    res.status(201).json({ message: "Created.", data: newBook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Fixed server listening on http://localhost:${PORT}`);
});

