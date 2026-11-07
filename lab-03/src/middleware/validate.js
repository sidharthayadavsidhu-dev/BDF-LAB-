// src/middleware/validate.js
// Request-body validation for POST /books and PUT /books/:id

/**
 * Validates the book payload sent in req.body.
 *
 * Rules
 * ─────
 *  POST  → title, author and price are all required.
 *  PUT   → same (full replacement).
 *  PATCH → only validates fields that are actually present.
 *
 * On failure  → 400 { message, errors[] }
 * On success  → calls next()
 */
export function validateBook(req, res, next) {
  const { title, author, price } = req.body;
  const errors = [];
  const isPost = req.method === "POST";
  const isPut  = req.method === "PUT";

  // ── Required-field checks (POST and PUT only) ──────────────────────────────
  if ((isPost || isPut) && !title) {
    errors.push("title is required and must not be empty.");
  }

  if ((isPost || isPut) && !author) {
    errors.push("author is required and must not be empty.");
  }

  if ((isPost || isPut) && price === undefined) {
    errors.push("price is required.");
  }

  // ── Numeric / range check (all methods, when price is present) ─────────────
  if (price !== undefined) {
    const n = Number(price);
    if (isNaN(n)) {
      errors.push(`price must be a numeric value, received: "${price}".`);
    } else if (n < 0) {
      errors.push("price must be 0 or greater.");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed.", errors });
  }

  next();
}

