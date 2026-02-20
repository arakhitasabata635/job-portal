import { SessionEntity } from './session.type.js';
import * as hash from '../../shared/helpers/hash.helper.js';

export const isSessionReuse = (session: SessionEntity | null, oldRefreshToken: string) => {
  // session not in db means reuse token. it detect the expire tokens stollen
  if (!session) {
    throw new Error('Session reuse detected.');
  }

  const hashToken = hash.sha256Hash(oldRefreshToken);

  // heandle the active session reuse detaction
  if (hashToken !== session.token_hash) {
    throw new Error('Session reuse detected.');
  }
  return;
};

export const isTokenExp = (tokenExp: number) => {
  return tokenExp * 1000 < Date.now();
};
