import express from "express";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";

const app = express();
app.use(express.json);

app.use(globalErrorHandler);
export default app;
