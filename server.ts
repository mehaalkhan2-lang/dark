import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (err) {
    console.error("Firebase Admin initialization failed. Push notifications might not work without service account credentials.", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  
  // API Route for Admin Market Intelligence
  app.post("/api/admin/suggest", async (req, res) => {
    try {
      const prompt = `SCAN COMPLETE MARKET. 
        Identify the top 3 high-probability pairs for 1-minute to 5-minute binary options.
        STRICT REQUIREMENT: Be straightforward. No fluff. Give clear directions.
        
        For each pair, provide:
        - Symbol
        - Predicted Direction (CALL/PUT)
        - Accuracy Confidence (90-100%)
        - Straightforward Reasoning (e.g., "Liquidity grab at 1.08500", "RSI Oversold + Support")
        - Entry window.

        Format as a clean JSON object with a 'suggestions' array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are the 'ADMIN DARK TRADING BRAIN'. Your advice must be straightforward, technical, and direct. You analyze high-velocity institutional flows. If you see a 95%+ setup, mark it as 'CRITICAL'.",
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    symbol: { type: "string" },
                    direction: { type: "string" },
                    confidence: { type: "number" },
                    reason: { type: "string" },
                    entry: { type: "string" },
                    isCritical: { type: "boolean" }
                  },
                  required: ["symbol", "direction", "confidence", "reason", "entry"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("Admin Brain Error:", error);
      res.status(500).json({ error: "Intelligence Uplink Failure" });
    }
  });

  // API Route for Broadcast Notifications
  app.post("/api/push/broadcast", async (req, res) => {
    try {
      const { title, body, data } = req.body;
      
      if (!admin.apps.length) {
        // Log locally but return error to client
        console.log("Firebase Admin not ready for broadcast - check service account");
        return res.status(500).json({ error: "Push backend not configured." });
      }

      // Fetch all active tokens
      const snapshot = await admin.firestore().collection('push_tokens').where('active', '==', true).get();
      const tokens = snapshot.docs.map(doc => doc.data().token).filter(t => !!t);

      if (tokens.length === 0) {
        return res.json({ success: true, message: "No active tokens found" });
      }

      console.log(`Attempting broadcast to ${tokens.length} devices...`);

      const message = {
        notification: { title, body },
        data: data || {},
        tokens: tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);
      
      res.json({ 
        success: true, 
        sentCount: response.successCount, 
        failureCount: response.failureCount 
      });
    } catch (error) {
      console.error("Broadcast Error:", error);
      res.status(500).json({ error: "Notification broadcast failed" });
    }
  });

  // API Route for AI Scanning
  app.post("/api/bot/scan", async (req, res) => {
    try {
      const { asset, symbol, isOtc, brokerName } = req.body;
      
      const prompt = `Perform a deep technical multi-timeframe analysis for ${asset} (${symbol}). 
        Context: ${brokerName} Platform ${isOtc ? '(OTC Algorithmic Market)' : '(RE-TIME INTERBANK FEED)'}.
        Current Market Conditions: High Volatility, Significant Order Imbalance detected at psychological levels.
        
        Focus on 1-MINUTE EXPIRATION parameters:
        - Instantaneous Price Action Momentum.
        - Institutional Liquidity Sourcing Levels (Shadow Levels).
        - RSI (7) overbought/oversold with volume confirmation.
        - Support/Resistance liquidy pools on the 5-minute chart.
        - Candle patterns: Pin bars, Engulfing, displacement candles.

        Provide: 
        1. Direction (CALL/PUT)
        2. Confidence level (0-100%)
        3. Detailed technical reasoning (Deeply technical summary)
        4. Target Price Projection (Precise for 1-minute expiration)`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are an elite quantitative analyst bot for ${brokerName}. ${isOtc ? 'Monitor OTC algorithmic patterns and price spikes.' : 'Analyze institutional order flow and macro-economic correlations.'} Your signals must be highly precise and deeply descriptive.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              direction: { type: "string" },
              confidence: { type: "number" },
              reason: { type: "string" },
              target: { type: "string" }
            },
            required: ["direction", "confidence", "reason", "target"]
          }
        },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error) {
      console.error("Scanning API Error:", error);
      res.status(500).json({ error: "Neural processing failed" });
    }
  });

  // API Route for Purchase Verification
  app.post("/api/bot/verify-purchase", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;

      const prompt = `Analyze this transaction screenshot. 
      Verify the following payment details:
      - Recipient Number: 03451959533
      - Recipient Name: Hijran Bano (accept minor variations like Hijra Bano)
      - Amount: 1000 PKR
      - Status: Must be Successful / Sent / Paid / Completed
      
      Extract the Transaction ID, the exact amount found, and the recipient name found.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              isValid: { type: "boolean" },
              transactionId: { type: "string" },
              amountDetected: { type: "string" },
              recipientDetected: { type: "string" },
              reason: { type: "string" }
            },
            required: ["isValid", "transactionId", "amountDetected", "recipientDetected", "reason"]
          }
        },
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        ],
      });

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error) {
      console.error("Verification API Error:", error);
      res.status(500).json({ error: "AI Vision Analysis failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
