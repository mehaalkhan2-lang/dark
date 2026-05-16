import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
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
