"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const job_controller_1 = require("./controller/job.controller");
const http_exception_1 = require("hono/http-exception");
const logger_1 = require("hono/logger");
require("./controller/worker.controller");
const app = new hono_1.Hono();
app.use((0, logger_1.logger)());
app.get("/", (c) => c.text("Hello from Resumify worker node!"));
app.post("/fetch", (c) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield c.req.json();
    return c.json({ success: true }, 200);
}));
app.post("/api/addJob", job_controller_1.handleAddJob);
app.onError((err, c) => {
    console.error(err.message);
    if (err instanceof http_exception_1.HTTPException) {
        return c.json({ success: false, message: err.getResponse() });
    }
    return c.json({ success: false, message: "Internal Server Error!" }, 500);
});
app.notFound((c) => {
    return c.text("Page not found!", 404);
});
(0, node_server_1.serve)({
    port: 8000,
    fetch: app.fetch,
});
