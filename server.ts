import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const CHANGELLY_API_URL = "https://api.changelly.com/v2";

function getChangellyAuthHeaders(body: string) {
  const privateKeyHex = process.env.CHANGELLY_API_SECRET;
  if (!privateKeyHex) {
    throw new Error("CHANGELLY_API_SECRET is not configured");
  }

  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKeyHex, "hex"),
    format: "der",
    type: "pkcs8",
  });

  const publicKey = crypto.createPublicKey(privateKey).export({
    type: "pkcs1",
    format: "der",
  });

  const apiKey = crypto.createHash("sha256").update(publicKey).digest("base64");
  const signature = crypto.sign("sha256", Buffer.from(body), privateKey).toString("base64");

  return {
    "X-Api-Key": apiKey,
    "X-Api-Signature": signature,
  };
}

// Changelly Proxy Route
app.post("/api/changelly", async (req, res) => {
  if (!process.env.CHANGELLY_API_SECRET) {
    return res.status(500).json({
      error: {
        message:
          "Changelly API secret not configured. Please set CHANGELLY_API_SECRET in your environment.",
      },
    });
  }

  const { method, params } = req.body;
  const payload = {
    jsonrpc: "2.0",
    id: Date.now().toString(),
    method,
    params,
  };
  const body = JSON.stringify(payload);

  try {
    const authHeaders = getChangellyAuthHeaders(body);
    const response = await fetch(CHANGELLY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body,
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Changelly API returned non-JSON response:", text.slice(0, 200));
      return res.status(502).json({
        error: { message: "Changelly API returned an invalid response" },
      });
    }

    res.status(response.ok ? 200 : response.status).json(data);
  } catch (error) {
    console.error("Changelly API error:", error);
    res.status(500).json({
      error: { message: "Failed to communicate with Changelly API" },
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
