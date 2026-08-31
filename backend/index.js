//express
const express = require("express");
const app = express();

//cors
const cors = require("cors");
const corsOriginsFromEnv = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (corsOriginsFromEnv.length === 0) return callback(null, true);
    if (corsOriginsFromEnv.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["*"],
  exposedHeaders: ["*"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Razorpay webhook needs raw body for signature verification (must be before express.json)
const razorpayWebhookController = require("./controllers/client/razorpayWebhook.controller");
app.use(
  "/api/client/razorpay/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhookController.handleRazorpayWebhook
);

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

//logging middleware
const logger = require("morgan");
app.use(logger("dev"));

//path
const path = require("path");

//fs
const fs = require("fs");

//dotenv
require("dotenv").config({ path: ".env" });

//socket io
const http = require("http");
const server = http.createServer(app);
global.io = require("socket.io")(server, {
  cors: {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    credentials: corsOptions.credentials,
    allowedHeaders: corsOptions.allowedHeaders,
  },
  transports: ["websocket", "polling"],
});

//connection.js
const db = require("./util/connection");

//Declare global variable
global.settingJSON = {};

//Declare the function as a global variable to update the setting.js file
global.updateSettingFile = (settingData) => {
  const settingJSON = JSON.stringify(settingData, null, 2);
  fs.writeFileSync("setting.js", `module.exports = ${settingJSON};`, "utf8");

  global.settingJSON = settingData; // Update global variable
  console.log("Settings file updated.");
};

//Step 1: Import initializeSettings
const initializeSettings = require("./util/initializeSettings");

async function startServer() {
  console.log("🔄 Initializing settings...");
  await initializeSettings();
  console.log("✅ Settings Loaded");

  // Backend Health & System Status Page
  const apiStatusHandler = async (req, res) => {
    const isDbConnected = db.readyState === 1;
    const uptimeSeconds = Math.floor(process.uptime());
    const host = req.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const adminUrl = process.env.ADMIN_URL || (isLocal ? "http://localhost:3000" : "https://admin.quietchat.in");

    let recentErrors = [];
    try {
      const RewardSystemLog = require("./models/rewardSystemLog.model");
      recentErrors = await RewardSystemLog.find({ level: "error" }).sort({ createdAt: -1 }).limit(5);
    } catch (err) {
      recentErrors = [];
    }

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="15">
        <title>QuietChat Backend - System Health</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body { 
            background: radial-gradient(circle at top, #1e293b 0%, #0f172a 100%); 
            color: #f8fafc; 
            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
            min-height: 100vh; 
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px; 
            margin: 0;
          }
          .container-box { width: 100%; max-width: 900px; margin: auto; }
          .card-custom { 
            background: rgba(30, 41, 59, 0.75); 
            backdrop-filter: blur(20px); 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 24px; 
            padding: 32px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); 
          }
          @media (max-width: 576px) {
            .card-custom { padding: 20px; border-radius: 16px; }
          }
          .badge-status { 
            display: inline-flex; 
            align-items: center; 
            gap: 10px; 
            padding: 8px 18px; 
            border-radius: 9999px; 
            font-weight: 600; 
            font-size: 0.875rem;
            letter-spacing: 0.5px;
          }
          .badge-ok { 
            background: rgba(34, 197, 94, 0.12); 
            color: #4ade80; 
            border: 1px solid rgba(34, 197, 94, 0.25); 
            box-shadow: 0 0 15px rgba(34, 197, 94, 0.2);
          }
          .badge-err { 
            background: rgba(239, 68, 68, 0.12); 
            color: #f87171; 
            border: 1px solid rgba(239, 68, 68, 0.25); 
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
          }
          .glow-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
            box-shadow: 0 0 8px currentColor;
          }
          .metric-box { 
            background: rgba(15, 23, 42, 0.6); 
            border: 1px solid rgba(255, 255, 255, 0.06); 
            border-radius: 16px; 
            padding: 20px; 
            text-align: center;
            height: 100%;
            transition: transform 0.2s ease, border-color 0.2s ease;
          }
          .metric-box:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.15);
          }
          .error-row { 
            background: rgba(239, 68, 68, 0.08); 
            border: 1px solid rgba(239, 68, 68, 0.2); 
            border-radius: 12px; 
            padding: 16px; 
            margin-bottom: 12px; 
          }
          .btn-primary-custom {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            color: white;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 9999px;
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
            transition: all 0.2s ease;
          }
          .btn-primary-custom:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 24px rgba(37, 99, 235, 0.4);
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container-box">
          <div class="card-custom">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <h3 class="fw-bold mb-1 d-flex align-items-center gap-2">
                  <i class="ri-heart-pulse-line text-success"></i> QuietChat Backend System
                </h3>
                <p class="text-secondary small mb-0">Live Server Status & Automatic Error Monitoring</p>
              </div>
              <div class="badge-status ${isDbConnected ? "badge-ok" : "badge-err"}">
                <span class="glow-dot" style="background: ${isDbConnected ? "#4ade80" : "#f87171"};"></span>
                ${isDbConnected ? "BACKEND RUNNING SMOOTHLY" : "DATABASE ERROR"}
              </div>
            </div>

            <!-- Grid Metrics -->
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-4">
                <div class="metric-box">
                  <div class="text-secondary small mb-1">Backend Server</div>
                  <div class="fw-bold text-success fs-5">🟢 ACTIVE (Port ${process.env.PORT || 5000})</div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="metric-box">
                  <div class="text-secondary small mb-1">MongoDB Database</div>
                  <div class="fw-bold ${isDbConnected ? "text-success" : "text-danger"} fs-5">
                    ${isDbConnected ? "🟢 CONNECTED" : "🔴 DISCONNECTED"}
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-4">
                <div class="metric-box">
                  <div class="text-secondary small mb-1">Server Uptime</div>
                  <div class="fw-bold text-info fs-5">${uptimeSeconds}s</div>
                </div>
              </div>
            </div>

            <!-- Error Diagnostics Monitor -->
            <div class="mb-4">
              <h5 class="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <i class="ri-bug-line text-warning"></i> API & System Failures Monitor
              </h5>

              ${
                recentErrors.length === 0
                  ? `
                  <div class="p-4 rounded-4 text-center" style="background: rgba(34, 197, 94, 0.04); border: 1px solid rgba(34, 197, 94, 0.18);">
                    <i class="ri-checkbox-circle-fill text-success fs-1 mb-2 d-block"></i>
                    <h6 class="fw-bold text-success mb-1">No API / System Failures Detected!</h6>
                    <p class="text-secondary small mb-0">All API endpoints, reward engine callbacks, and socket servers are operating cleanly without errors.</p>
                  </div>
                `
                  : recentErrors
                      .map(
                        (err) => `
                  <div class="error-row">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="badge bg-danger">${err.source || "API Error"}</span>
                      <small class="text-secondary">${new Date(err.createdAt).toLocaleTimeString()}</small>
                    </div>
                    <div class="fw-semibold text-light mb-1">${err.message}</div>
                    <small class="text-secondary font-monospace d-block text-truncate">${err.stackTrace || ""}</small>
                  </div>
                `
                      )
                      .join("")
              }
            </div>

            <!-- Footer Action -->
            <div class="pt-3 border-top border-secondary text-center">
              <a href="${adminUrl}" target="_blank" class="btn btn-primary-custom text-decoration-none">
                <i class="ri-dashboard-line me-2"></i>Open Admin Panel (${adminUrl})
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  };

  app.get("/", apiStatusHandler);
  app.get("/api", apiStatusHandler);

  //Step 2: Require all other modules after settings are initialized
  const routes = require("./routes/route");
  app.use("/api", routes);

  require("./socket");

  app.use("/storage", express.static(path.join(__dirname, "storage")));

  db.on("error", () => {
    console.log("Connection Error: ");
  });

  db.once("open", async () => {
    console.log("Mongo: successfully connected to db");
  });

  //Schedule the chat job
  const scheduleChatJob = require("./worker/bullRandomChatJob");
  scheduleChatJob();

  //Schedule the AI nudge job
  const startAINudgeJob = require("./worker/aiNudgeJob");
  startAINudgeJob();

  //Step 3: Start Server after all setup is done (0.0.0.0 = listen on all interfaces / your IP)
  const port = process?.env?.PORT || 5000;
  const host = process?.env?.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    console.log("Hello World ! listening on http://" + host + ":" + port);
  });
}

//Run server startup
startServer();
