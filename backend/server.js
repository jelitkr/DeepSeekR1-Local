const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
const whitelist = [
  "http://localhost:5000",
  "http://localhost:3000",
  "http://localhost:3001",
];
const PORT = process.env.PORT || 3001;

app.use(express.json());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.post("/chat", async (req, res) => {
  const userInput = req.body.input;

  if (!userInput) {
    return res.status(400).json({ error: "Input is missing or empty" });
  }

  try {
    const response = await axios.post("http://localhost:5000/generate", {
      prompt: userInput,
      max_length: 200, // give R1 more room
    });

    // Flask now returns { response: "<model text>" }
    res.json({ response: response.data.response });
  } catch (error) {
    console.error("Error communicating with D-R1:", error);
    res.status(500).send("Error communicating with D-R1");
  }
});

module.exports = app;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
