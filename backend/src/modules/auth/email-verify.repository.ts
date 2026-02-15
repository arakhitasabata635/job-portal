import { sql } from '../../config/db.js';

interface ResetPasswordSchema {
  id: string;
  user_id: string;
  token_hash: string;
  used: boolean;
  expires_at: Date;
}

export const create = async (userId: string, token_hash: string) => {
  await sql`
    INSERT INTO email_verify_tokens 
    (user_id, token_hash)
    VALUES (${userId}, ${token_hash})
  `;
};

export const findByHashToken = async (token_hash: string): Promise<ResetPasswordSchema | null> => {
  const [record] = await sql`
    SELECT *
    FROM email_verify_tokens
    WHERE token_hash = ${token_hash}
      AND expires_at > NOW()
  `;

  return record ? (record as ResetPasswordSchema) : null;
};

export const deleteToken = async (token_hash: string) => {
  await sql`
  DELETE email_verify_tokens
  `;
};
