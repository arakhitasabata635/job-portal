import express from "express";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { authLimiter } from "./utils/authLimiter.js";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  console.log("got the req", req.url);
  next();
});
// limit the attempts
// app.use("/api/auth", authLimiter);
app.use("/api/auth", router);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(globalErrorHandler);

export default app;
