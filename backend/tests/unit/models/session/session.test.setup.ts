import { jest } from '@jest/globals';

export async function setupSessionTest() {
  jest.resetModules();

  jest.unstable_mockModule('@/modules/session/session.repository.js', () => ({
    createSession: jest.fn(),
    deleteSession: jest.fn(),
    findSession: jest.fn(),
    findSessionBySessionId: jest.fn(),
    updateSessionToken: jest.fn(),
  }));

  jest.unstable_mockModule('@/shared/helpers/hash.helper.js', () => ({
    sha256Hash: jest.fn(),
  }));

  jest.unstable_mockModule('@/modules/session/auth.token.js', () => ({
    generateSessionTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/auth/auth.repository.js', () => ({
    findUserByid: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/session/session.utils.js', () => ({
    isSessionReuse: jest.fn(),
    isTokenExp: jest.fn(),
  }));

  const sessionRepo = await import('@/modules/session/session.repository.js');
  const authRepo = await import('@/modules/auth/auth.repository.js');
  const hash = await import('@/shared/helpers/hash.helper.js');
  const sessionToken = await import('@/modules/session/auth.token.js');
  const sessionUtils = await import('@/modules/session/session.utils.js');
  const sessionService = await import('@/modules/session/session.service.js');

  return {
    sessionRepo: sessionRepo as jest.Mocked<typeof sessionRepo>,
    authRepo: authRepo as jest.Mocked<typeof authRepo>,
    hash: hash as jest.Mocked<typeof hash>,
    sessionToken: sessionToken as jest.Mocked<typeof sessionToken>,
    sessionUtils: sessionUtils as jest.Mocked<typeof sessionUtils>,
    sessionService,
  };
}
