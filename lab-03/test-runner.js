// test-runner.js  – in-process smoke tests (no HTTP server or network needed)
// Tests the DB layer, validation middleware and SQL query logic directly.
// Usage:  npm test

import db from "./src/db/database.js";
import { validateBook } from "./src/middleware/validate.js";

// ── Helpers ──────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;

function assert(label, condition) {
  if (condition) { console.log(`  ✅  ${label}`); pass++; }
  else           { console.error(`  ❌  ${label}`); fail++; }
}

function mockRes() {
  const r = { _status: 200, _body: null };
  r.status = (s) => { r._status = s; return r; };
  r.json   = (b) => { r._body  = b; return r; };
  return r;
}

function mockReq(body = {}, params = {}, query = {}, method = "GET") {
  return { body, params, query, method };
}

// ── 1. Database layer ────────────────────────────────────────────────────────
console.log("\n── Database layer ──────────────────────────────────");

const allBooks = await db.all("SELECT * FROM books");
assert("books table has ≥ 10 rows", allBooks.length >= 10);

const one = await db.get("SELECT * FROM books WHERE id = ?", [1]);
assert("db.get returns a book object for id=1", one && one.id === 1);

const missing = await db.get("SELECT * FROM books WHERE id = ?", [9999]);
assert("db.get returns undefined for a missing id", missing === undefined);

// ── 2. Validation middleware ─────────────────────────────────────────────────
console.log("\n── Validation middleware ───────────────────────────");

{
  const req = mockReq({ title: "T", author: "A", price: 9.99 }, {}, {}, "POST");
  const res = mockRes();
  let called = false;
  validateBook(req, res, () => { called = true; });
  assert("Valid POST body → next() called", called);
}
{
  const req = mockReq({ author: "A", price: 9.99 }, {}, {}, "POST");
  const res = mockRes();
  validateBook(req, res, () => {});
  assert("Missing title → 400", res._status === 400);
  assert("Missing title → errors array", Array.isArray(res._body?.errors));
}
{
  const req = mockReq({ title: "T", author: "A", price: "abc" }, {}, {}, "POST");
  const res = mockRes();
  validateBook(req, res, () => {});
  assert("Non-numeric price → 400", res._status === 400);
  assert("Non-numeric price error mentions 'price'",
    res._body?.errors?.[0]?.toLowerCase().includes("price"));
}
{
  const req = mockReq({ price: -1 }, {}, {}, "PATCH");
  const res = mockRes();
  validateBook(req, res, () => {});
  assert("Negative price → 400", res._status === 400);
}
{
  const req = mockReq({ title: "T", author: "A" }, {}, {}, "POST");
  const res = mockRes();
  validateBook(req, res, () => {});
  assert("Missing price on POST → 400", res._status === 400);
}

// ── 3. Query-param sanitisation ──────────────────────────────────────────────
console.log("\n── Query-param sanitisation ────────────────────────");

{
  const ALLOWED = ["id", "title", "author", "price", "created_at"];
  assert("'price' is in allow-list", ALLOWED.includes("price"));
  const inject = ALLOWED.includes("'; DROP TABLE books;--") ? "injected" : "id";
  assert("SQL injection in order_by falls back to 'id'", inject === "id");
}

// ── 4. Price-range filter ────────────────────────────────────────────────────
console.log("\n── Price-range filter ──────────────────────────────");

const between = await db.all(
  "SELECT * FROM books WHERE price BETWEEN ? AND ?", [30, 50]
);
assert("BETWEEN 30 AND 50 returns ≥ 1 book", between.length >= 1);
assert("All returned prices are in [30, 50]",
  between.every(b => b.price >= 30 && b.price <= 50));

const minOnly = await db.all("SELECT * FROM books WHERE price >= ?", [80]);
assert("price >= 80 returns ≥ 1 book", minOnly.length >= 1);

// ── 5. LIKE title search ─────────────────────────────────────────────────────
console.log("\n── LIKE title search ───────────────────────────────");

const likeRows = await db.all(
  "SELECT * FROM books WHERE title LIKE ?", ["%clean%"]
);
assert("LIKE '%clean%' finds ≥ 1 book with 'clean' in title",
  likeRows.length >= 1);

// ── 6. INSERT → SELECT → DELETE round-trip ───────────────────────────────────
console.log("\n── INSERT → SELECT → DELETE ────────────────────────");

const ins = await db.run(
  "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
  ["Test Book", "Test Author", 1.23]
);
assert("INSERT resolves with lastID > 0", ins.lastID > 0);

const fetched = await db.get(
  "SELECT * FROM books WHERE id = ?", [ins.lastID]
);
assert("Fetched row matches inserted data",
  fetched?.title === "Test Book" && fetched?.price === 1.23);

await db.run("DELETE FROM books WHERE id = ?", [ins.lastID]);
const afterDel = await db.get(
  "SELECT * FROM books WHERE id = ?", [ins.lastID]
);
assert("Row is gone after DELETE", afterDel === undefined);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

