import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

  // API Route for AI Scanning
  app.post("/api/bot/scan", async (req, res) => {
    try {
      const { asset, symbol, isOtc, brokerName } = req.body;
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        systemInstruction: `You are an elite quantitative analyst bot for ${brokerName}. ${isOtc ? 'Monitor OTC algorithmic patterns and price spikes.' : 'Analyze institutional order flow and macro-economic correlations.'} Your signals must be highly precise and deeply descriptive.`
      });

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

      const resultArr = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
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
        }
      });

      const response = JSON.parse(resultArr.response.text());
      res.json(response);
    } catch (error) {
      console.error("Scanning API Error:", error);
      res.status(500).json({ error: "Neural processing failed" });
    }
  });

  // API Route for Purchase Verification
  app.post("/api/bot/verify-purchase", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const prompt = `Analyze this transaction screenshot. 
      Verify the following payment details:
      - Recipient Number: 03451959533
      - Recipient Name: Hijran Bano (accept minor variations like Hijra Bano)
      - Amount: 1000 PKR
      - Status: Must be Successful / Sent / Paid / Completed
      
      Extract the Transaction ID, the exact amount found, and the recipient name found.`;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
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
        }
      });

      const response = JSON.parse(result.response.text());
      res.json(response);
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
