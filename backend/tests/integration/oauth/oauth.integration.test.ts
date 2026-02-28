import { jest } from '@jest/globals';
import type { generateUrlForGoogleOauth } from '@/modules/oauth/oauth.service.js';

//mock the generateUrlForGoogleOauth service
jest.resetModules();
const mockGenerateUrl: jest.MockedFunction<typeof generateUrlForGoogleOauth> = jest.fn();
jest.unstable_mockModule('@/modules/oauth/oauth.service.js', () => ({
  generateUrlForGoogleOauth: mockGenerateUrl,
}));

let app: typeof import('@/app.js').default;

beforeAll(async () => {
  // 🔥 import AFTER mock
  const appModule = await import('@/app.js');
  app = appModule.default;
});
import request from 'supertest';
describe('oauth integration testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create google oauth login url /google', () => {
    const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';
    const mockCodeVerifier = 'mock-code-verifier';
    const mockState = 'mock-state';

    it('should gave the google oauth login url', async () => {
      mockGenerateUrl.mockResolvedValue({ url: mockUrl, codeVerifier: mockCodeVerifier, state: mockState });

      const res = await request(app).get('/api/oauth/google');

      expect(res.status).toBe(302);

      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('pkce_verifier='), expect.stringContaining('google_state=')]),
      );
      expect(res.headers.location).toContain('accounts.google.com');
    });

    it('should throw error if service throw error', async () => {
      mockGenerateUrl.mockRejectedValue(new Error('Service failed'));
      const res = await request(app).get('/api/oauth/google');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
    });
  });
});
