require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const nodeCleanup = require("node-cleanup");

// Import loops & helpers
const { initCampaign } = require("./loops/campaignBeta.js");
const { runCampaign } = require("./loops/campaignLoop.js");
const { init, cleanup } = require("./helper/addon/qr");
const { warmerLoopInit } = require("./helper/addon/qr/warmer/index.js");

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors());
app.use(fileUpload());

// Routes
const routes = [
  ["user", "/api/user"],
  ["web", "/api/web"],
  ["admin", "/api/admin"],
  ["phonebook", "/api/phonebook"],
  ["chatFlow", "/api/chat_flow"],
  ["inbox", "/api/inbox"],
  ["templet", "/api/templet"],
  ["chatbot", "/api/chatbot"],
  ["broadcast", "/api/broadcast"],
  ["apiv2", "/api/v1"],
  ["agent", "/api/agent"],
  ["qr", "/api/qr"],
  ["ai", "/api/ai"],
];

routes.forEach(([file, route]) => {
  app.use(route, require(`./routes/${file}`));
});

// Serve frontend
const currentDir = process.cwd();
app.use(express.static(path.resolve(currentDir, "./client/public")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(currentDir, "./client/public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`WaCrm server is running on port ${PORT}`);

  // Start background tasks only once after server starts
  init();
  setTimeout(() => {
    runCampaign();
    warmerLoopInit();
    initCampaign();
  }, 1000);
});

// Initialize Socket.IO on the same server
const io = require("./socket").initializeSocket(server);
module.exports = io;

// Cleanup on exit
nodeCleanup(cleanup);
