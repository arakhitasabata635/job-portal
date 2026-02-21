import { jest } from '@jest/globals';
import { UserDTO } from '@/modules/auth/auth.types.js';
import { setupSessionTest } from './session.test.setup.js';

describe('session service', () => {
  let sessionCtx: Awaited<ReturnType<typeof setupSessionTest>>; // ctx means context:- The full environment or setup required to run something.

  beforeAll(async () => {
    sessionCtx = await setupSessionTest();
  });

  /* ========================================================== */
  /* createSessionForUser */
  /* ========================================================== */
  describe('create session for user', () => {
    const mockUserDTO: UserDTO = {
      userId: 'user-123',
      name: 'John',
      email: 'john@test.com',
      isEmailVerify: true,
      phoneNumber: '9012785564',
      role: 'jobseeker',
      createdAt: new Date(),
    };
    const mockDeviceInfo = 'Chrome-Windows';
    const mockIp = '192.168.1.1';

    beforeEach(() => {
      jest.clearAllMocks();
    });

    /* ---------------------------------------------------------- */
    /* ✅ SUCCESS CASE */
    /* ---------------------------------------------------------- */
    it('should create session and return tokens successfully', async () => {
      //arrange
      const mockAccess = 'access-token';
      const mockRefresh = 'refresh-token';
      const mockHash = 'hashed-refresh-token';

      sessionCtx.sessionToken.generateSessionTokens.mockReturnValue({
        accessToken: mockAccess,
        refreshToken: mockRefresh,
      });
      sessionCtx.hash.sha256Hash.mockReturnValue(mockHash);
      sessionCtx.sessionRepo.createSession.mockResolvedValue(undefined);

      /* act */
      const result = await sessionCtx.sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, mockIp);

      /* Assertions */
      expect(sessionCtx.sessionToken.generateSessionTokens).toHaveBeenCalledTimes(1);
      expect(sessionCtx.sessionToken.generateSessionTokens).toHaveBeenCalledWith(
        mockUserDTO.userId,
        mockUserDTO.role,
        expect.any(String),
      );
      expect(sessionCtx.hash.sha256Hash).toHaveBeenCalledWith(mockRefresh);
      expect(sessionCtx.sessionRepo.createSession).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        userId: mockUserDTO.userId,
        tokenHash: mockHash,
        deviceInfo: mockDeviceInfo,
        ipAddress: mockIp,
      });
      expect(result).toEqual({
        accessToken: mockAccess,
        refreshToken: mockRefresh,
      });
    });
    /* ---------------------------------------------------------- */
    /* ❌ TOKEN GENERATION FAILURE */
    /* ---------------------------------------------------------- */
    it('should throw if sessionRepo.createSession fails', async () => {
      sessionCtx.sessionToken.generateSessionTokens.mockReturnValue({
        accessToken: 'a',
        refreshToken: 'r',
      });
      sessionCtx.hash.sha256Hash.mockReturnValue('hash-r');
      sessionCtx.sessionRepo.createSession.mockImplementation(() => {
        throw new Error('DB Error');
      });
      await expect(sessionCtx.sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, mockIp)).rejects.toThrow(
        'DB Error',
      );
      expect(sessionCtx.sessionRepo.createSession).toHaveBeenCalledTimes(1);
    });
    /* ---------------------------------------------------------- */
    /* ❌ TOKEN GENERATION FAILURE */
    /* ---------------------------------------------------------- */
    it('should throw if generateSessionTokens fails', async () => {
      sessionCtx.sessionToken.generateSessionTokens.mockImplementation(() => {
        throw new Error('JWT Error');
      });
      await expect(sessionCtx.sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, mockIp)).rejects.toThrow(
        'JWT Error',
      );
      expect(sessionCtx.sessionRepo.createSession).not.toHaveBeenCalled();
    });

    /* ---------------------------------------------------------- */
    /* ❌ HASH FAILURE */
    /* ---------------------------------------------------------- */
    it('should throw if hashing fails', async () => {
      sessionCtx.sessionToken.generateSessionTokens.mockReturnValue({
        accessToken: 'a',
        refreshToken: 'r',
      });
      sessionCtx.hash.sha256Hash.mockImplementation(() => {
        throw new Error('Hash Fail');
      });

      await expect(sessionCtx.sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, mockIp)).rejects.toThrow(
        'Hash Fail',
      );
      expect(sessionCtx.sessionRepo.createSession).not.toHaveBeenCalled();
    });

    /* ---------------------------------------------------------- */
    /* ✅ NULL IP CASE */
    /* ---------------------------------------------------------- */
    it('should allow null ipAddress', async () => {
      sessionCtx.sessionToken.generateSessionTokens.mockReturnValue({
        accessToken: 'a',
        refreshToken: 'r',
      });
      sessionCtx.hash.sha256Hash.mockReturnValue('hash-r');
      sessionCtx.sessionRepo.createSession.mockResolvedValue(undefined);

      await sessionCtx.sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, null);

      expect(sessionCtx.sessionRepo.createSession).toHaveBeenCalledWith(expect.objectContaining({ ipAddress: null }));
    });
  });

  /* ========================================================== */
  /* refreshSessionService */
  /* ========================================================== */
  describe('refreshSessionService', () => {
    const oldRefreshToken = 'old-refresh-token';
    const hashRefresh = 'hash-token';
    const mockDecoded = {
      userId: 'user-1',
      sessionId: 'session-123',
    };
    const mockSession = {
      sessionId: 'session-1',
      userId: 'user-1',
      tokenHash: 'oldHash',
    };
    const mockUser = {
      userId: 'user-1',
      role: 'jobseeker',
    };
    beforeEach(() => {
      jest.clearAllMocks();
    });
  });
});
