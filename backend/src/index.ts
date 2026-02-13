import { config } from './config/env.js';
import app from './app.js';
import initDb from './config/init.js';

async function startServer() {
  try {
    await initDb();

    app.listen(config.port, () => {
      console.log(`🚀 Auth service running on http://localhost:${config.port}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
