import app from './app.js';
import dotenv from 'dotenv';
import initDb from './config/init.js';
import { config } from './config/env.js';

dotenv.config();

async function startServer() {
  try {
    await initDb();

    app.listen(config.node_env, () => {
      console.log(`🚀 Auth service running on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
