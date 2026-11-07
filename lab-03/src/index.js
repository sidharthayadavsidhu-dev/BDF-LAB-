// src/index.js  – application entry point
// On first boot (e.g. a fresh Render deploy) the DB is initialised
// automatically so no manual "npm run init-db" is needed in production.

import express  from "express";
import booksRouter from "./routes/books.js";
import { ensureSchema } from "./db/init.js";   // auto-init on startup

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Auto-initialise the database ──────────────────────────────────────────────
await ensureSchema();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/books", booksRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Lab 3 – Books REST API is running 🚀" });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Server listening on http://localhost:${PORT}`);
  console.log(`📚  Try: GET http://localhost:${PORT}/books`);
});
