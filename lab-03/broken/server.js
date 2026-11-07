// broken/server.js
// ════════════════════════════════════════════════════════════════════════════
//  DEBUGGING EXERCISE  –  Lab 3
//  This file contains FOUR deliberate bugs. Find and fix them all before
//  looking at broken/server_fixed.js.
//
//  Bug index (do NOT read until you have tried to debug):
//    Bug 1 – Port conflict         EADDRINUSE       line ≈ 20
//    Bug 2 – Wrong import path                      line ≈ 24
//    Bug 3 – Table-name typo       no such table    line ≈ 37
//    Bug 4 – Missing await                          line ≈ 60
// ════════════════════════════════════════════════════════════════════════════

import express from "express";

const app = express();
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 ── Port conflict
//   Symptom : Error: listen EADDRINUSE :::3000
//   Cause   : port 3000 is already used by the working server.
//   Fix     : change to a free port, e.g. 3001.
// ─────────────────────────────────────────────────────────────────────────────
const PORT = 3000;             // ← BUG 1

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 ── Wrong import path  ("datbase" is missing the letter 'a')
//   Symptom : Cannot find module '../src/db/datbase.js'
//   Fix     : change "datbase" → "database"
// ─────────────────────────────────────────────────────────────────────────────
import db from "../src/db/datbase.js";   // ← BUG 2

// ── GET /books ────────────────────────────────────────────────────────────────
app.get("/books", async (req, res) => {
  try {
    // ─────────────────────────────────────────────────────────────────────────
    // BUG 3 ── Table-name typo  ("book" vs "books")
    //   Symptom : SQLITE_ERROR: no such table: book
    //   Fix     : change "FROM book" → "FROM books"
    // ─────────────────────────────────────────────────────────────────────────
    const rows = await db.all("SELECT * FROM book");   // ← BUG 3
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
    // ─────────────────────────────────────────────────────────────────────────
    // BUG 4 ── Missing await
    //   Symptom : result is a Promise object, so result.lastID is undefined.
    //             The follow-up SELECT finds nothing → response has data: null.
    //   Fix     : add "await" before db.run(...)
    // ─────────────────────────────────────────────────────────────────────────
    const result = db.run(                             // ← BUG 4
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [title, author, parseFloat(price)]
    );

    // result.lastID is undefined here because result is still a Promise
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
  console.log(`Broken server listening on http://localhost:${PORT}`);
});

