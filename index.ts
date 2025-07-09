import express from "express";

const app = express();
const PORT = 8000;

app.get("/", (req, res) => {
  res.send("🚀 Hello from TypeScript + Express");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
