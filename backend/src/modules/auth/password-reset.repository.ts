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
    INSERT INTO password_reset_tokens 
    (user_id, token_hash)
    VALUES (${userId}, ${token_hash})
  `;
};

export const findByHashToken = async (token_hash: string): Promise<ResetPasswordSchema | null> => {
  const [record] = await sql`
    SELECT *
    FROM password_reset_tokens
    WHERE token_hash = ${token_hash}
      AND expires_at > NOW()
  `;

  return record ? (record as ResetPasswordSchema) : null;
};

export const markUsed = async (id: string) => {
  await sql`
  UPDATE password_reset_tokens 
  SET used = TRUE
  WHERE id= ${id}
  `;
};
