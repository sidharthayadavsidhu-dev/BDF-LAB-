const http = require("http");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Hello");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Plain HTTP server is running at http://localhost:${PORT}`);
});
