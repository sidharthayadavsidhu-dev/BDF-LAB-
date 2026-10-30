const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const PORT = process.env.PORT || 3000;
const DATABASE_PATH = path.join(__dirname, "database.db");
const app = express();

app.use(express.json());

let db;

app.get("/books/", async (request, response, next) => {
  try {
    const books = await db.all("SELECT * FROM book ORDER BY id");
    response.json(books);
  } catch (error) {
    next(error);
  }
});

app.get("/books/:bookId/", async (request, response, next) => {
  try {
    const book = await db.get("SELECT * FROM book WHERE id = ?", [
      request.params.bookId,
    ]);

    if (!book) {
      return response.status(404).json({ error: "Book not found" });
    }

    response.json(book);
  } catch (error) {
    next(error);
  }
});

app.post("/books/", async (request, response, next) => {
  const { title, author, price, pages } = request.body;

  if (
    typeof title !== "string" ||
    typeof author !== "string" ||
    !Number.isInteger(price) ||
    !Number.isInteger(pages)
  ) {
    return response.status(400).json({
      error: "title and author must be strings; price and pages must be integers",
    });
  }

  try {
    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)",
      [title, author, price, pages],
    );
    const book = await db.get("SELECT * FROM book WHERE id = ?", [
      result.lastID,
    ]);
    response.status(201).json(book);
  } catch (error) {
    next(error);
  }
});

app.put("/books/:bookId/", async (request, response, next) => {
  const { title, author, price, pages } = request.body;

  if (
    typeof title !== "string" ||
    typeof author !== "string" ||
    !Number.isInteger(price) ||
    !Number.isInteger(pages)
  ) {
    return response.status(400).json({
      error: "title and author must be strings; price and pages must be integers",
    });
  }

  try {
    const result = await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?",
      [title, author, price, pages, request.params.bookId],
    );

    if (result.changes === 0) {
      return response.status(404).json({ error: "Book not found" });
    }

    const book = await db.get("SELECT * FROM book WHERE id = ?", [
      request.params.bookId,
    ]);
    response.json(book);
  } catch (error) {
    next(error);
  }
});

app.delete("/books/:bookId/", async (request, response, next) => {
  try {
    const result = await db.run("DELETE FROM book WHERE id = ?", [
      request.params.bookId,
    ]);

    if (result.changes === 0) {
      return response.status(404).json({ error: "Book not found" });
    }

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});

async function initializeDBAndServer() {
  db = await open({
    filename: DATABASE_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    )
  `);

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

initializeDBAndServer().catch((error) => {
  console.error("Failed to initialize the database or start the server:", error);
  process.exitCode = 1;
});
