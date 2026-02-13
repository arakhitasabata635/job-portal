import { sql } from '../../../config/db.js';
import { OauthEntity } from '../../oauth/oauth.type.js';

export const findOauthAccount = async (provider: String, providerUserId: string): Promise<OauthEntity | null> => {
  const [account] = await sql`
  SELECT * FROM oauth_accounts
  WHERE provider= ${provider} AND
  provider_user_id=${providerUserId}
  `;
  if (!account) return null;

  return account as OauthEntity;
};

export const createOauthAccount = async (userId: string, provider: string, providerUserId: string): Promise<void> => {
  await sql`
    INSERT INTO oauth_accounts
    (user_id, provider, provider_user_id)
    VALUES (${userId}, ${provider}, ${providerUserId});
  `;
};
