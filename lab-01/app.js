const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// GET / - welcome text
app.get("/", (req, res) => {
  res.status(200).send("Welcome to the Node.js and Express Lab 1 server!");
});

// GET /about - basic student information
app.get("/about", (req, res) => {
  res.status(200).json({
    name: "Muthangi Sidhartha",
    section: "CSE(GAI)2B",
    RegistrationNumber: "252U1R9102"
  });
});

// GET /time - current server date and time
app.get("/time", (req, res) => {
  res.status(200).json({
    currentDateTime: new Date().toString()
  });
});

// 404 handler for every unknown path
app.use((req, res) => {
  res.status(404).send("404 - Page not found");
});

app.listen(PORT, () => {
  console.log(`Express server is running at http://localhost:${PORT}`);
});
