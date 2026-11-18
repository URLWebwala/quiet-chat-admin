import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  const { baseUrl, slug, message, external_user_id, user_name, user_gender, authToken } = req.body;

  const targetUrl = `${(baseUrl || "https://adminai.quietchat.in/api").replace(/\/$/, "")}/hosts/${slug || "aisha-sweet"}/chat`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken && typeof authToken === "string" && authToken.trim()) {
      headers["Authorization"] = `Bearer ${authToken.trim()}`;
    }

    const response = await axios.post(
      targetUrl,
      {
        message: message || "Hello",
        external_user_id: external_user_id || "react_user",
        user_name: user_name || "Rahul",
        user_gender: user_gender || "male",
      },
      {
        headers,
        timeout: 25000,
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message || "Failed to reach AI Model API" };
    return res.status(status).json({
      error: true,
      status,
      details: data,
    });
  }
}
