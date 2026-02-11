import app from "./app.js";
import dotenv from "dotenv";
import initDb from "./db/init.js";

dotenv.config();

async function startServer() {
  try {
    await initDb();

    app.listen(process.env.PORT, () => {
      console.log(
        `🚀 Auth service running on http://localhost:${process.env.PORT}`,
      );
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
