import express from "express";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log("got the req", req.url);
  next();
});
app.use("/api/auth", router);
app.use(globalErrorHandler);
export default app;
