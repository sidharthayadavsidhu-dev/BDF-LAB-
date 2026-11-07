// src/db/database.js
// Opens (or creates) the SQLite database file and exports a small
// promise-based wrapper around the callback-style sqlite3 API.

import sqlite3pkg from "sqlite3";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const sqlite3 = sqlite3pkg.verbose();

// Resolve __dirname in an ES-module context
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DB_PATH  = path.join(DATA_DIR, "books.db");

// Make sure the data/ directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

// Open the database (creates the file if it does not exist)
const _db = new sqlite3.Database(DB_PATH);

// WAL mode – better read-concurrency
_db.run("PRAGMA journal_mode = WAL");

// ── Promise wrappers ──────────────────────────────────────────────────────────

/** Run an INSERT / UPDATE / DELETE / DDL statement.
 *  Resolves with { lastID, changes }. */
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/** Fetch all matching rows as an array. */
export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/** Fetch a single row, or undefined when nothing matches. */
export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    _db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);           // undefined when not found
    });
  });
}

/** Execute one or more DDL statements (no parameters). */
export function exec(sql) {
  return new Promise((resolve, reject) => {
    _db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export default { run, all, get, exec };

