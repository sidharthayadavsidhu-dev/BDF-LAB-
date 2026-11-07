// src/routes/books.js
// All /books route handlers.
// Demonstrates: noun-based endpoints, search/sort/pagination, price-range
// filtering, body validation and correct HTTP status codes.

import { Router } from "express";
import db          from "../db/database.js";
import { validateBook } from "../middleware/validate.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /books
// ─────────────────────────────────────────────────────────────────────────────
// Query parameters (all optional – each has a sensible default):
//
//   search_q  – partial title match (SQL LIKE '%value%')   default: ""
//   order_by  – column to sort by                          default: "id"
//   order     – sort direction ASC | DESC                  default: "ASC"
//   limit     – max rows returned (1–100)                  default: 10
//   offset    – rows to skip for pagination                default: 0
//   min_price – lower price bound (inclusive)              default: none
//   max_price – upper price bound (inclusive)              default: none
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    // ── 1. Parse & sanitise ──────────────────────────────────────────────────
    const search_q = req.query.search_q ?? "";

    // Allow-list prevents SQL injection via the ORDER BY clause
    const ALLOWED_COLS = ["id", "title", "author", "price", "created_at"];
    const order_by = ALLOWED_COLS.includes(req.query.order_by)
      ? req.query.order_by
      : "id";

    const order = req.query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const limit  = Math.max(1,  Math.min(100, parseInt(req.query.limit)  || 10));
    const offset = Math.max(0,              (parseInt(req.query.offset) || 0));

    const min_price = parseFloat(req.query.min_price);
    const max_price = parseFloat(req.query.max_price);

    // ── 2. Build dynamic SQL (parameterised – no string concatenation of user input)
    const conditions = [];
    const params     = [];

    if (search_q) {
      conditions.push("title LIKE ?");
      params.push(`%${search_q}%`);
    }

    // Price-range: BETWEEN when both bounds present, one-sided otherwise
    if (!isNaN(min_price) && !isNaN(max_price)) {
      conditions.push("price BETWEEN ? AND ?");
      params.push(min_price, max_price);
    } else if (!isNaN(min_price)) {
      conditions.push("price >= ?");
      params.push(min_price);
    } else if (!isNaN(max_price)) {
      conditions.push("price <= ?");
      params.push(max_price);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total matching rows (for pagination metadata)
    const countRow = await db.get(
      `SELECT COUNT(*) AS total FROM books ${where}`,
      params
    );

    // order_by is from the allow-list → safe to interpolate
    const books = await db.all(
      `SELECT id, title, author, price, created_at
       FROM   books
       ${where}
       ORDER  BY ${order_by} ${order}
       LIMIT  ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      total:  countRow.total,
      limit,
      offset,
      count:  books.length,
      data:   books,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /books/:id  →  200 | 404
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const book = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [req.params.id]
    );

    if (!book) {
      return res
        .status(404)
        .json({ message: `Book with id ${req.params.id} not found.` });
    }

    return res.status(200).json({ data: book });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /books  →  201 Created | 400 Bad Request
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", validateBook, async (req, res) => {
  try {
    const { title, author, price } = req.body;

    const result = await db.run(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [title, author, parseFloat(price)]
    );

    const newBook = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [result.lastID]
    );

    return res.status(201).json({
      message: "Book created successfully.",
      data:    newBook,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /books/:id  –  full replacement  →  200 | 400 | 404
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id", validateBook, async (req, res) => {
  try {
    const existing = await db.get(
      "SELECT id FROM books WHERE id = ?",
      [req.params.id]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ message: `Book with id ${req.params.id} not found.` });
    }

    const { title, author, price } = req.body;

    await db.run(
      "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?",
      [title, author, parseFloat(price), req.params.id]
    );

    const updated = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [req.params.id]
    );

    return res.status(200).json({
      message: "Book updated successfully.",
      data:    updated,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /books/:id  –  partial update  →  200 | 400 | 404
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/:id", validateBook, async (req, res) => {
  try {
    const existing = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [req.params.id]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ message: `Book with id ${req.params.id} not found.` });
    }

    // Merge supplied fields with stored values
    const title  = req.body.title  ?? existing.title;
    const author = req.body.author ?? existing.author;
    const price  = req.body.price !== undefined
      ? parseFloat(req.body.price)
      : existing.price;

    await db.run(
      "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?",
      [title, author, price, req.params.id]
    );

    const updated = await db.get(
      "SELECT * FROM books WHERE id = ?",
      [req.params.id]
    );

    return res.status(200).json({
      message: "Book updated successfully.",
      data:    updated,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /books/:id  →  200 | 404
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const existing = await db.get(
      "SELECT id FROM books WHERE id = ?",
      [req.params.id]
    );

    if (!existing) {
      return res
        .status(404)
        .json({ message: `Book with id ${req.params.id} not found.` });
    }

    await db.run("DELETE FROM books WHERE id = ?", [req.params.id]);

    return res.status(200).json({
      message: `Book with id ${req.params.id} deleted successfully.`,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;

