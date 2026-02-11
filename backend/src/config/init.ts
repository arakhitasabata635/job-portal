import { sql } from './db.js';

async function initDb() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;
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
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email  VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  hashpassword VARCHAR(255),
  phone_number VARCHAR(20),
  role user_role NOT NULL DEFAULT 'jobseeker',
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
  user_id UUID NOT NULL REFERENCES users(user_id)ON DELETE CASCADE,
  skill_id INTEGER NOT NULL REFERENCES skills(skill_id)ON DELETE CASCADE,
  PRIMARY KEY (user_id, skill_id)
  )
  `;
    await sql`
  CREATE TABLE IF NOT EXISTS refresh_tokens(
  session_id UUID PRIMARY KEY ,
  user_id UUID NOT NULL REFERENCES users(user_id)ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
  )`;
    await sql`
  CREATE INDEX IF NOT EXISTS idx_refresh_user_id 
  ON refresh_tokens(user_id)`;
    await sql`
  CREATE INDEX IF NOT EXISTS idx_refresh_expires 
  ON refresh_tokens(expires_at);`;

    await sql`
  CREATE TABLE IF NOT EXISTS oauth_accounts(
  id UUID PRIMARY KEY  DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role user_role NOT NULL,
  provider VARCHAR(50) NOT NULL,            
  provider_user_id VARCHAR(255) NOT NULL, 
  created_at TIMESTAMPTZ DEFAULT NOW(), 
  CONSTRAINT uq_provider_user UNIQUE (provider, provider_user_id)
  );
  `;

    console.log('✅ database table checked and created');
  } catch (error) {
    console.log('❌ ERROR INITIALIZING DATABASE', error);
    process.exit(1);
  }
}

export default initDb;
