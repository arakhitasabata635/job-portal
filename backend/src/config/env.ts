import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().default('5000'),
  DB_URL: z.string().url(),

  ACCESS_TOKEN_SECRET: z.string().min(10),
  ACCESS_TOKEN_EXPIRE: z.string().default('30m'),

  REFRESH_TOKEN_SECRET: z.string().min(10),
  REFRESH_TOKEN_EXPIRE: z.string().default('7d'),
  REFRESH_TOKEN_COOKIE_NAME: z.string(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(
    parsedEnv.error.issues.map((err) => ({
      field: err.path[0] as string,
      message: err.message,
    })),
  );
  process.exit(1);
}
const data = parsedEnv.data;
export const config = {
  node_env: data.NODE_ENV,
  jwt: {
    access_token: {
      secret: data.ACCESS_TOKEN_SECRET,
      expire: data.ACCESS_TOKEN_EXPIRE,
    },
    refresh_token: {
      secret: data.REFRESH_TOKEN_SECRET,
      expire: data.REFRESH_TOKEN_EXPIRE,
      cookie_name: data.REFRESH_TOKEN_COOKIE_NAME,
    },
  },
  oauth: {
    google: {
      client_id: data.GOOGLE_CLIENT_ID,
      client_secret: data.GOOGLE_CLIENT_SECRET,
      redirect_url: data.GOOGLE_REDIRECT_URI,
    },
  },
};
