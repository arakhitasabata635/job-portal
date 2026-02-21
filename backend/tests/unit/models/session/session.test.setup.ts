import { jest } from '@jest/globals';

export async function setupSessionTest() {
  jest.resetModules();

  jest.unstable_mockModule('@/modules/session/session.repository.js', () => ({
    createSession: jest.fn(),
    deleteSession: jest.fn(),
    findSession: jest.fn(),
  }));

  jest.unstable_mockModule('@/shared/helpers/hash.helper.js', () => ({
    sha256Hash: jest.fn(),
  }));

  jest.unstable_mockModule('@/modules/session/auth.token.js', () => ({
    generateSessionTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  }));

  const sessionRepo = await import('@/modules/session/session.repository.js');
  const hash = await import('@/shared/helpers/hash.helper.js');
  const sessionToken = await import('@/modules/session/auth.token.js');
  const sessionService = await import('@/modules/session/session.service.js');

  return {
    sessionRepo,
    hash,
    sessionToken,
    sessionService,
  };
}
