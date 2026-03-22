require("dotenv").config();

const http = require("http");
const { createServer, startServer } = require("./src/server");

const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 8080;
let grpcReady = false;

const healthServer = http.createServer((req, res) => {
  if (req.url === "/health/live") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, status: "live" }));
    return;
  }

  if (req.url === "/health/ready") {
    const statusCode = grpcReady ? 200 : 503;
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: grpcReady, status: grpcReady ? "ready" : "starting" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false }));
});

if (require.main === module) {
  healthServer.listen(HEALTH_PORT, "0.0.0.0", () => {
    console.log(`File server health endpoint listening on port ${HEALTH_PORT}`);
  });

  startServer()
    .then(() => {
      grpcReady = true;
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  createServer,
  startServer,
};
