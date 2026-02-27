import { sql } from '../../config/db.js';

interface EmailVerificationEntity {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
}
export const create = async (userId: string, token_hash: string) => {
  await sql`
    INSERT INTO email_verify_tokens 
    (user_id, token_hash)
    VALUES (${userId}, ${token_hash})
  `;
};

export const findByHashToken = async (token_hash: string): Promise<EmailVerificationEntity | null> => {
  const [record] = await sql`
    SELECT *
    FROM email_verify_tokens
    WHERE token_hash = ${token_hash}
      AND expires_at > NOW()
  `;

  return record ? (record as EmailVerificationEntity) : null;
};

export const deleteToken = async (token_hash: string) => {
  await sql`
   DELETE FROM email_verify_tokens
   WHERE token_hash = ${token_hash}
  `;
};
export const deleteTokenByUserId = async (user_id: string) => {
  await sql`
   DELETE FROM email_verify_tokens
   WHERE user_id = ${user_id}
  `;
};

export const findByUserId = async (userId: string): Promise<EmailVerificationEntity[] | null> => {
  const record = await sql`
    SELECT *
    FROM email_verify_tokens
    WHERE user_id = ${userId}
  `;

  return record.length ? (record as EmailVerificationEntity[]) : null;
};
