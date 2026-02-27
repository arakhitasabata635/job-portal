import { jest } from '@jest/globals';
import { UserRole } from '@/types/role.js';
import { googleOauthSetUp } from './oauth.test.setup.js';

describe('oauth unit test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  /* ======================================
   GOOGLE CALLBACK FUNCTION
====================================== */
  describe('goolgecallback service unit test', () => {
    let googleOauthCtx: Awaited<ReturnType<typeof googleOauthSetUp>>;

    beforeAll(async () => {
      googleOauthCtx = await googleOauthSetUp();
    });

    const mockPayload = {
      sub: 'google123',
      email: 'test@gmail.com',
      email_verified: true,
      name: 'Test User',
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

    it('should verify token, create session and return tokens', async () => {
      googleOauthCtx.googleProvider.verifyGoogleToken.mockResolvedValue(mockPayload);

      googleOauthCtx.oauthUserService.findOrCreateUserFromGoogle.mockResolvedValue(mockUserDTO);
      googleOauthCtx.sessionService.createSessionForUser.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await googleOauthCtx.oauthService.googleCallbackService('verifier', 'code', 'device', '127.0.0.1');

      expect(result.userDTO).toEqual(mockUserDTO);
      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
    });

    it('should throw if verifyGoogleToken fails', async () => {
      googleOauthCtx.googleProvider.verifyGoogleToken.mockRejectedValue(new Error('Invalid code'));

      await expect(googleOauthCtx.oauthService.googleCallbackService('v', 'c', 'd', null)).rejects.toThrow(
        'Invalid code',
      );
    });
  });
});
