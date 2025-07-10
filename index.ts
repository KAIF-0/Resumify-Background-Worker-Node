import { handleAddJob } from "./controller/job.controller";
import "./controller/worker.controller";
import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Hello from TypeScript + Express");
});

app.post("/api/addJob", handleAddJob);

export default app;
