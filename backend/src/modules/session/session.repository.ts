import { sql } from '../../config/db.js';
import { SessionEntity } from './session.type.js';

interface CreateSessionInput {
  sessionId: string;
  userId: string;
  tokenHash: string;
  deviceInfo: string;
  ipAddress: string | null;
}

export const createSession = async ({ sessionId, userId, tokenHash, deviceInfo, ipAddress }: CreateSessionInput) => {
  await sql`
    INSERT INTO refresh_tokens 
    (session_id, user_id, token_hash, device_info, ip_address)
    VALUES 
    (${sessionId}, ${userId}, ${tokenHash}, ${deviceInfo}, ${ipAddress});
  `;
};

export const findSessionBySessionId = async (sessionId: string): Promise<SessionEntity | null> => {
  const [session] = await sql`
  SELECT * FROM refresh_tokens
  WHERE session_id = ${sessionId}
  `;
  if (!session) return null;
  return session as SessionEntity;
};
export const findSessionByuserId = async (userId: string): Promise<SessionEntity[] | null> => {
  const [sessions] = await sql`
  SELECT * FROM refresh_tokens
  WHERE user_id = ${userId}
  `;
  if (!sessions) return null;
  return sessions as SessionEntity[];
};

export const updateSessionToken = async (sessionId: string, newTokenHash: string) => {
  await sql`
    UPDATE refresh_tokens
    SET token_hash = ${newTokenHash},
    created_at = NOW()
    WHERE session_id = ${sessionId};
  `;
};

export const deleteSessionById = async (sessionId: string) => {
  await sql`
    DELETE FROM refresh_tokens
    WHERE session_id = ${sessionId};
  `;
};

export const deleteAllSessionsByUserId = async (userId: string) => {
  await sql`
    DELETE FROM refresh_tokens
    WHERE user_id = ${userId};
  `;
};
