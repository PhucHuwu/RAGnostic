const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const app = express();
const port = process.env.BFF_PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ragnostic-bff" });
});

app.get("/api/config", (req, res) => {
  res.json({
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"
  });
});

app.listen(port, () => {
  console.log(`RAGnostic BFF listening on :${port}`);
});
