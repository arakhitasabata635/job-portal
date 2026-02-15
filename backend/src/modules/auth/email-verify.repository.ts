import { sql } from '../../config/db.js';

export const create = async (userId: string, token_hash: string) => {
  await sql`
    INSERT INTO email_verify_tokens 
    (user_id, token_hash)
    VALUES (${userId}, ${token_hash})
  `;
};

export const findByHashToken = async (token_hash: string) => {
  const [record] = await sql`
    SELECT *
    FROM email_verify_tokens
    WHERE token_hash = ${token_hash}
      AND expires_at > NOW()
  `;

  return record;
};

export const deleteToken = async (token_hash: string) => {
  await sql`
   DELETE email_verify_tokens
   WHERE token_hash = ${token_hash}
  `;
};
