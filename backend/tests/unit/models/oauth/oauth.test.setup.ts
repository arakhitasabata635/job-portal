import { jest } from '@jest/globals';

export async function googleOauthSetUp() {
  jest.resetModules();

  jest.unstable_mockModule('@/modules/oauth/providers/google.provider.js', () => ({
    verifyGoogleToken: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/oauth/oauth.user.service.js', () => ({
    findOrCreateUserFromGoogle: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/session/session.service.js', () => ({
    createSessionForUser: jest.fn(),
  }));

  const googleProvider = await import('@/modules/oauth/providers/google.provider.js');
  const oauthService = await import('@/modules/oauth/oauth.service.js');
  const oauthUserService = await import('@/modules/oauth/oauth.user.service.js');
  const sessionService = await import('@/modules/session/session.service.js');

  return {
    googleProvider: googleProvider as jest.Mocked<typeof googleProvider>,
    oauthUserService: oauthUserService as jest.Mocked<typeof oauthUserService>,
    sessionService: sessionService as jest.Mocked<typeof sessionService>,
    oauthService,
  };
}
export async function oauthUserSetUp() {
  jest.resetModules();

  jest.unstable_mockModule('@/modules/oauth/providers/google.provider.js', () => ({
    verifyGoogleToken: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/oauth/oauth.user.service.js', () => ({
    findOrCreateUserFromGoogle: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/session/session.service.js', () => ({
    createSessionForUser: jest.fn(),
  }));

  const googleProvider = await import('@/modules/oauth/providers/google.provider.js');
  const oauthService = await import('@/modules/oauth/oauth.service.js');
  const oauthUserService = await import('@/modules/oauth/oauth.user.service.js');
  const sessionService = await import('@/modules/session/session.service.js');

  return {
    googleProvider: googleProvider as jest.Mocked<typeof googleProvider>,
    oauthUserService: oauthUserService as jest.Mocked<typeof oauthUserService>,
    sessionService: sessionService as jest.Mocked<typeof sessionService>,
    oauthService,
  };
}
