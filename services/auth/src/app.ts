import express from "express";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";
import router from "./routes/index.js";

const app = express();
app.use(express.json());
app.use("/api/auth", router);
app.use(globalErrorHandler);
export default app;
