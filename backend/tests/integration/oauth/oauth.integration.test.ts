import { jest } from '@jest/globals';
import request from 'supertest';
import { UserRole } from '@/types/role.js';
import { config } from '@/config/env.js';
/* ======================================
   SETUP FUNCTION 
====================================== */
const mockGoogleProvider = async () => {
  jest.resetModules();
  jest.unstable_mockModule('@/modules/oauth/providers/google.provider.js', () => ({
    makeUrlForGoogleLogin: jest.fn(),
    verifyGoogleToken: jest.fn(),
  }));

  const app = (await import('@/app.js')).default;
  const googleProvider = await import('@/modules/oauth/providers/google.provider.js');
  const authRepo = await import('@/modules/auth/auth.repository.js');
  const oauthRepo = await import('@/modules/oauth/oauth.repository.js');
  const sessionRepo = await import('@/modules/session/session.repository.js');

  return {
    app,
    googleProvider: googleProvider as jest.Mocked<typeof googleProvider>,
    oauthRepo,
    authRepo,
    sessionRepo,
  };
};
let oauthCtx: Awaited<ReturnType<typeof mockGoogleProvider>>;
beforeAll(async () => {
  oauthCtx = await mockGoogleProvider();
});

/* ======================================
  GOOGLE OAUTH LOGIN
====================================== */
describe('oauth integration testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  /* ======================================
   GOOGLE URL CREATE
====================================== */
  describe('create google oauth login url /google', () => {
    const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';

    /* ======================================
   SUCCESS
====================================== */
    it('should gave the google oauth login url', async () => {
      oauthCtx.googleProvider.makeUrlForGoogleLogin.mockReturnValue(mockUrl);

      const res = await request(oauthCtx.app).get('/api/oauth/google');

      expect(res.status).toBe(302);

      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('pkce_verifier='), expect.stringContaining('google_state=')]),
      );
      expect(res.headers.location).toContain('accounts.google.com');
    });
  });

  /* ======================================
   GOOGLE CALLBACK FUNCTION
====================================== */
  describe('google callback /api/oauth/google-callback integration test', () => {
    const mockUser = {
      user_id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hash-password',
      email_verified: false,
      phone_number: '9999999999',
      role: UserRole.JOBSEEKER,
      created_at: new Date(),
    };
    const mockUserDTO = {
      userId: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      isEmailVerify: false,
      phoneNumber: '9999999999',
      role: UserRole.JOBSEEKER,
      createdAt: new Date(),
    };
    const mockInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phoneNumber: '9999999999',
      role: UserRole.JOBSEEKER,
    };

    const validPayload = {
      sub: 'google-123',
      email: 'oauth@test.com',
      email_verified: true,
      name: 'OAuth User',
    };

    const validState = 'valid-state';
    const validCode = 'valid-code';
    const validVerifier = 'valid-verifier';

    // =============================
    // ✅ SUCCESS FLOW
    // =============================
    it('should login successfully and return accessToken + set refresh cookie', async () => {
      oauthCtx.googleProvider.verifyGoogleToken.mockResolvedValue(validPayload);
      const res = await request(oauthCtx.app)
        .get('/api/oauth/google-callback')
        .query({ state: validState, code: validCode })
        .set('Cookie', [`pkce_verifier=${validVerifier}`, `google_state=${validState}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.user.userId).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();

      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining(config.jwt.refresh_token.cookie_name)]),
      );
    });
  });
});
