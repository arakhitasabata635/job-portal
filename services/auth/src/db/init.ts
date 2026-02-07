import { sql } from "./index.js";

async function initDb() {
  try {
    await sql`
  DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname= 'user_role') THEN
  CREATE TYPE user_role AS ENUM ('jobseeker', 'recruiter');
    END IF;
    END;
    $$;
  `;
    await sql`
  CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email  VARCHAR(255) NOT NULL,
  email_varified BOOLEAN DEFAULT FALSE,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  role user_role NOT NULL,
  bio TEXT,
  resume VARCHAR(255) ,
  resume_public_id VARCHAR(255),
  profile_pic VARCHAR(255),
  profile_pic_public_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subscription TIMESTAMPTZ
  )
  `;

    await sql`
  CREATE TABLE IF NOT EXISTS skills (
  skill_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE 
  )
  `;
    await sql`
  CREATE TABLE IF NOT EXISTS user_skills(
  user_id INTEGER NOT NULL REFERENCES users(user_id)ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(skill_id)ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
  )
  `;
    await sql`
  CREATE TABLE IF NOT EXISTS refresh_tokens(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(user_id)ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  CONSTRAINT unique_token_hash UNIQUE (token_hash)
  )`;
    console.log("✅ database table checked and created");
  } catch (error) {
    console.log("❌ ERROR INITIALIZING DATABASE", error);
    process.exit(1);
  }
}

export default initDb;
