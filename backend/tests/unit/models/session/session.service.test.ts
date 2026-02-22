import { jest } from '@jest/globals';
import { UserEntity } from '@/modules/auth/auth.types.js';
import { setupSessionTest } from './session.test.setup.js';
import { SessionEntity } from '@/modules/session/session.type.js';
import { UserRole } from '@/types/role.js';

describe('session service', () => {
  let sessionCtx: Awaited<ReturnType<typeof setupSessionTest>>; // ctx means context:- The full environment or setup required to run something.

  beforeAll(async () => {
    sessionCtx = await setupSessionTest();
  });

  /* ========================================================== */
  /* createSessionForUser */
  /* ========================================================== */
  describe('create session for user', () => {
    const mockUserDTO = {
      userId: 'user-123',
      role: UserRole.JOBSEEKER,
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
    const mockDecoded = {
      userId: 'user-1',
      sessionId: 'session-123',
    };
    const mockSession: SessionEntity = {
      session_id: 'session-1',
      user_id: 'user-1',
      token_hash: 'oldHash',
      device_info: 'device-1',
      ip_address: '127.0.0.0',
      created_at: new Date(),
      expires_at: new Date(),
    };
    const mockUser = {
      role: UserRole.JOBSEEKER,
    };
    beforeEach(() => {
      jest.clearAllMocks();
    });

    /* ========================================================= */
    /* ✅ SUCCESS FLOW */
    /* ========================================================= */
    it('should rotate refresh token successfully', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);
      sessionCtx.sessionUtils.isSessionReuse.mockImplementation(() => {});
      sessionCtx.sessionUtils.isSessionExp.mockReturnValue(false);
      sessionCtx.authRepo.findUserRoleById.mockResolvedValue(mockUser);
      sessionCtx.sessionToken.generateSessionTokens.mockReturnValue({
        accessToken: 'new-acces',
        refreshToken: 'new-refresh',
      });
      sessionCtx.hash.sha256Hash.mockReturnValue('new-refresh-hash');
      sessionCtx.sessionRepo.updateSessionToken.mockResolvedValue(undefined);

      const result = await sessionCtx.sessionService.refreshSessionService(oldRefreshToken);

      expect(result).toEqual({
        accessToken: 'new-acces',
        refreshToken: 'new-refresh',
      });
      expect(sessionCtx.sessionRepo.updateSessionToken).toHaveBeenCalledWith('session-1', 'new-refresh-hash');
    });
    /* ========================================================= */
    /* ❌ TOKEN VERIFY FAIL */
    /* ========================================================= */
    it('should throw if token verification fails', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid-Token');
      });
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);

      await expect(sessionCtx.sessionService.refreshSessionService(oldRefreshToken)).rejects.toThrow('Invalid-Token');

      expect(sessionCtx.sessionRepo.findSessionBySessionId).not.toHaveBeenCalled();
      expect(sessionCtx.sessionRepo.updateSessionToken).not.toHaveBeenCalled();
    });
    /* ========================================================= */
    /* ❌ SESSION REUSE DETECTED */
    /* ========================================================= */
    it('should delete all session if reuse detected', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);
      sessionCtx.sessionUtils.isSessionReuse.mockImplementation(() => {
        throw new Error('Session reuse detected');
      });

      await expect(sessionCtx.sessionService.refreshSessionService(oldRefreshToken)).rejects.toThrow(
        'Session reuse detected. Login again.',
      );
      expect(sessionCtx.sessionRepo.deleteAllSessionsByUser).toHaveBeenCalledTimes(1);
      expect(sessionCtx.sessionRepo.deleteAllSessionsByUser).toHaveBeenLastCalledWith(mockDecoded.userId);
      expect(sessionCtx.sessionRepo.updateSessionToken).not.toHaveBeenCalled();
    });
    /* ========================================================= */
    /* ❌ REFRESH TOKEN EXPIRED */
    /* ========================================================= */
    it('should return token expire relogin', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);
      sessionCtx.sessionUtils.isSessionReuse.mockImplementation(() => {});

      sessionCtx.sessionUtils.isSessionExp.mockReturnValue(true);

      await expect(sessionCtx.sessionService.refreshSessionService(oldRefreshToken)).rejects.toThrow(
        'Session got expire. Login again.',
      );
      expect(sessionCtx.sessionRepo.deleteSessionById).toHaveBeenCalledTimes(1);
      expect(sessionCtx.sessionRepo.updateSessionToken).not.toHaveBeenCalled();
    });
    /* ========================================================= */
    /* ❌ USER NOT FOUND */
    /* ========================================================= */
    it('should throw user no longer exist ', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);
      sessionCtx.sessionUtils.isSessionReuse.mockImplementation(() => {});
      sessionCtx.sessionUtils.isSessionExp.mockReturnValue(false);

      sessionCtx.authRepo.findUserRoleById.mockResolvedValue(null);
      await expect(sessionCtx.sessionService.refreshSessionService(oldRefreshToken)).rejects.toThrow(
        'User no longer exist',
      );
      expect(sessionCtx.sessionRepo.updateSessionToken).not.toHaveBeenCalled();
    });
  });
});
