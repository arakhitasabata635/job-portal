import cron from 'node-cron';
import { sql } from '../config/db.js';

export const startNightCleanup = () => {
  // Every day at 12:00 AM
  cron.schedule('0 0 * * *', async () => {
    console.log('Running nightly cleanup...');

    try {
      await sql`
        DELETE FROM email_verify_tokens
        WHERE expires_at < NOW()
      `;

      await sql`
        DELETE FROM password_reset_tokens
        WHERE expires_at < NOW()
      `;

      await sql`
        DELETE FROM refresh_tokens
        WHERE expires_at < NOW()
      `;

      console.log('Night cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  });
};
