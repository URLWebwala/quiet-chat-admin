//express
const express = require("express");
const route = express.Router();
const { DATING_AI_BASE_URL, createAIHeaders } = require("../util/aiConfig");

//admin index.js
const admin = require("./admin/route");

//agency index.js
const agency = require("./agency/route");

//client index.js
const client = require("./client/route");

// AI Model Chat Proxy (for live console & developer testing without CORS blocks)
route.post("/model-chat", async (req, res) => {
  try {
    const { baseUrl, slug, message, external_user_id, user_name, user_gender } = req.body || {};
    const targetSlug = slug || "aisha-sweet";
    const payload = {
      message: message || "Hello",
      external_user_id: external_user_id || "react_user",
      user_name: user_name || "Rahul",
      user_gender: user_gender || "male",
    };
    const path = `/api/hosts/${targetSlug}/chat`;
    const targetBase = (baseUrl ? baseUrl.replace(/\/api\/?$/, "") : DATING_AI_BASE_URL) || "https://adminai.quietchat.in";
    const headers = createAIHeaders("POST", path, payload);
    const aiRes = await fetch(`${targetBase}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await aiRes.json();
    return res.status(aiRes.status).json(data);
  } catch (err) {
    console.error("AI Model Chat Proxy Error:", err);
    return res.status(500).json({ error: true, message: err.message || "Failed to contact AI service" });
  }
});

route.use("/admin", admin);
route.use("/agency", agency);
route.use("/client", client);

module.exports = route;
