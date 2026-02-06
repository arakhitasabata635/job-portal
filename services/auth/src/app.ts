import express from "express";
import { globalErrorHandler } from "./middleware/globalError.middleware.js";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
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
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5, // Limit each IP to 5 login attempts
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // it gave the value with out x-
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({
        success: false,
        message: "Too many login attempts. Please try again after 1 houre.",
        retryAfter: res.getHeader("Retry-After"), // Tells them how many seconds to wait
      });
    },
  }),
);
app.use("/api/auth", router);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(globalErrorHandler);

export default app;
