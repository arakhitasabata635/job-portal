import { jest } from '@jest/globals';

export async function setupSessionTest() {
  jest.resetModules();

  await jest.unstable_mockModule('@/modules/session/session.repository.js', () => ({
    createSession: jest.fn(),
    deleteSession: jest.fn(),
    findSession: jest.fn(),
  }));

  await jest.unstable_mockModule('@/shared/helpers/hash.helper.js', () => ({
    sha256Hash: jest.fn(),
  }));

  await jest.unstable_mockModule('@/modules/session/auth.token.js', () => ({
    generateSessionTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  }));

  const repo = await import('@/modules/session/session.repository.js');
  const hash = await import('@/shared/helpers/hash.helper.js');
  const token = await import('@/modules/session/auth.token.js');
  const service = await import('@/modules/session/session.service.js');

  return {
    repo,
    hash,
    token,
    service,
  };
}
