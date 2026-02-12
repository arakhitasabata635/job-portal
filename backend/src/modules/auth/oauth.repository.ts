import { sql } from '../../config/db.js';

export const findOauthAccount = async (provider: String, providerUserId: string) => {
  const [account] = await sql`
  SELECT * FROM oauth_accounts
  WHERE provider= ${provider} AND
  provider_user_id=${providerUserId}
  `;
  return account ?? null;
};

export const createOauthAccount = async (
  userId: string,
  provider: string,
  providerUserId: string,
  role: string,
): Promise<void> => {
  await sql`
    INSERT INTO oauth_accounts
    (user_id, provider, provider_user_id, role)
    VALUES (${userId}, ${provider}, ${providerUserId}, ${role});
  `;
};
