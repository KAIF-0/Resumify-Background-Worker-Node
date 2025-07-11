import { serve } from "@hono/node-server";
import { Context, Hono } from "hono";
import { handleAddJob } from "./controller/job.controller";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import "./controller/worker.controller";

const app = new Hono();
app.use(logger());
app.get("/", (c: Context) => c.text("Hello from Resumify worker node!"));

app.post("/fetch", async (c: Context) => {
  const data = await c.req.json();
  return c.json({ success: true }, 200);
});

app.post("/api/addJob", handleAddJob);

app.onError((err: Error, c: Context) => {
  console.error(err.message);
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.getResponse() });
  }
  return c.json({ success: false, message: "Internal Server Error!" }, 500);
});

app.notFound((c: Context) => {
  return c.text("Page not found!", 404);
});

serve({
  port: 8000,
  fetch: app.fetch,
});
