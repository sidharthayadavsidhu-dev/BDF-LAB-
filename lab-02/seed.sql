CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
  (1, 'The Hobbit', 'J.R.R. Tolkien', 15, 310),
  (2, 'Pride and Prejudice', 'Jane Austen', 12, 432),
  (3, '1984', 'George Orwell', 14, 328),
  (4, 'To Kill a Mockingbird', 'Harper Lee', 13, 281),
  (5, 'The Great Gatsby', 'F. Scott Fitzgerald', 11, 180),
  (6, 'Moby-Dick', 'Herman Melville', 16, 635),
  (7, 'The Catcher in the Rye', 'J.D. Salinger', 12, 277),
  (8, 'Jane Eyre', 'Charlotte Bronte', 14, 500),
  (9, 'Frankenstein', 'Mary Shelley', 10, 280);
