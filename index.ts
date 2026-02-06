import { serve } from "@hono/node-server";
import { Context, Hono } from "hono";
import { handleAddJob } from "./controller/job.controller";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import "./controller/worker.controller";
import { prisma } from "./config/prism.config";

const app = new Hono();
app.use(logger());
app.get("/", (c: Context) => c.text("Hello from Resumify worker node!"));

app.get("/fetch", async (c: Context) => {
  try{
    //to keep supabase active and check db connection
    await prisma.portfolio.findUnique({ where: { id: "03986ebc-96b8-44d4-a801-6685fc4498d2" } });
  }catch(error){
    if(error instanceof Error){
      console.error("Error fetching data: ", error.message);
    }
  }
  return c.text("Hello from Resumify worker node!", 200);
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
