require("dotenv").config();

const { createServer, startServer } = require("./src/server");

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  createServer,
  startServer,
};
