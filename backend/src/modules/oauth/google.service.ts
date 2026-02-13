import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import crypto from 'crypto';

const client = new OAuth2Client(
  config.oauth.google.client_id,
  config.oauth.google.client_secret,
  config.oauth.google.redirect_url,
);

export const verifyGoogleToken = async (codeVerifier: string, code: string) => {
  const { tokens } = await client.getToken({
    code,
    codeVerifier,
  });

  if (!tokens?.id_token) throw new AppError(401, 'Invalid Google token');

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.oauth.google.client_id,
  });

  const payload = ticket.getPayload();

  if (!payload) throw new AppError(401, 'Invalid Google token');
  return payload;
};

export const generateUrlForGoogleOauth = async () => {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');

  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const url = client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });
  return { url, codeVerifier, state };
};
