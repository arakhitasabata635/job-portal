import { config } from './env.js';
import { neon } from '@neondatabase/serverless';

export const sql = neon(config.db_url);
