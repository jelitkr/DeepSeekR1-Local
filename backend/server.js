const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
const whitelist = [
  "http://localhost:5000",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8080",
  "http://ui:8080", // Docker internal network
];
const PORT = process.env.PORT || 3001;

// Store conversation history (in-memory for demo)
const conversations = new Map();

app.use(express.json());

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS request from origin:", origin);
    // Allow all origins for development (network access)
    callback(null, true);
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.post("/chat", async (req, res) => {
  const userInput = req.body.input;
  const conversationId = req.body.conversationId || "default";
  const includeHistory = req.body.includeHistory !== false; // Default to true

  if (!userInput) {
    return res.status(400).json({ error: "Input is missing or empty" });
  }

  try {
    // Get or initialize conversation history
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }
    const history = conversations.get(conversationId);

    // Build the prompt with history
    let fullPrompt = "";

    if (includeHistory && history.length > 0) {
      // Include last 5 messages for context (to avoid token limit)
      const recentHistory = history.slice(-5);
      fullPrompt = recentHistory
        .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n") + "\nUser: " + userInput;
    } else {
      fullPrompt = userInput;
    }

    // Use Docker service name when in Docker, localhost for development
    const deepseekUrl = process.env.DEEPSEEK_URL || "http://localhost:5000";
    const response = await axios.post(`${deepseekUrl}/generate`, {
      prompt: fullPrompt,
      max_length: 150, // optimized for speed and conciseness
    });

    const assistantResponse = response.data.response;

    // Store in history
    history.push({ role: "user", content: userInput });
    history.push({ role: "assistant", content: assistantResponse });

    // Keep history manageable (max 20 messages = 10 exchanges)
    if (history.length > 20) {
      conversations.set(conversationId, history.slice(-20));
    }

    // Return response with conversation ID for future requests
    res.json({
      response: assistantResponse,
      conversationId: conversationId,
      historyLength: conversations.get(conversationId).length
    });
  } catch (error) {
    console.error("Error communicating with model:", error.message);
    res.status(500).json({ error: "Error communicating with the model" });
  }
});

// New endpoint to clear conversation history
app.post("/chat/clear", (req, res) => {
  const conversationId = req.body.conversationId || "default";
  conversations.delete(conversationId);
  res.json({ success: true, message: "Conversation cleared" });
});

// New endpoint to get conversation history
app.get("/chat/history/:conversationId", (req, res) => {
  const conversationId = req.params.conversationId;
  const history = conversations.get(conversationId) || [];
  res.json({ history: history });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
