import { jest } from '@jest/globals';
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
  const mockSession: SessionEntity = {
    session_id: 'session-1',
    user_id: 'user-1',
    token_hash: 'oldHash',
    device_info: 'device-1',
    ip_address: '127.0.0.0',
    created_at: new Date(),
    expires_at: new Date(),
  };
  const mockDecoded = {
    userId: 'user-1',
    sessionId: 'session-123',
  };
  describe('refreshSessionService', () => {
    const oldRefreshToken = 'old-refresh-token';
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
      expect(sessionCtx.sessionRepo.deleteAllSessionsByUserId).toHaveBeenCalledTimes(1);
      expect(sessionCtx.sessionRepo.deleteAllSessionsByUserId).toHaveBeenLastCalledWith(mockDecoded.userId);
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
  /* ========================================================== */
  /* singleLogoutService */
  /* ========================================================== */
  describe('single session logout', () => {
    const mockRefreshToken = 'refresh-token';
    beforeEach(() => {
      jest.clearAllMocks();
    });

    /* ========================================================= */
    /* ✅ SUCCESS CASE */
    /* ========================================================= */
    it('should logout the current session', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);
      sessionCtx.sessionRepo.deleteSessionById.mockResolvedValue(undefined);

      const result = await sessionCtx.sessionService.singleLogoutService(mockRefreshToken);

      expect(sessionCtx.sessionToken.verifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(sessionCtx.sessionRepo.deleteSessionById).toHaveBeenCalledWith(mockDecoded.sessionId);
      expect(sessionCtx.sessionRepo.findSessionBySessionId).toHaveBeenCalledWith(mockDecoded.sessionId);
      expect(result).toBeUndefined();
    });
    /* ========================================================= */
    /* ❌ TOKEN VERIFICATION FAIL */
    /* ========================================================= */
    it('should throw if token verification fail', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockImplementation(() => {
        throw new Error('invelid-token');
      });
      await expect(sessionCtx.sessionService.singleLogoutService(mockRefreshToken)).rejects.toThrow('invelid-token');
    });
    /* ========================================================= */
    /* ❌ SESSION NOT FOUND (ALREADY LOGOUT) */
    /* ========================================================= */
    it('should throw Already logout if session not found', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);

      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(null);

      await expect(sessionCtx.sessionService.singleLogoutService(mockRefreshToken)).rejects.toThrow('Already logout');

      expect(sessionCtx.sessionRepo.deleteSessionById).not.toHaveBeenCalled();
    });
    /* ========================================================= */
    /* ❌ DELETE SESSION FAIL */
    /* ========================================================= */
    it('should propagate deleteSession error', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);
      sessionCtx.sessionRepo.findSessionBySessionId.mockResolvedValue(mockSession);
      sessionCtx.sessionRepo.deleteSessionById.mockRejectedValue(new Error('DB failure'));

      await expect(sessionCtx.sessionService.singleLogoutService(mockRefreshToken)).rejects.toThrow('DB failure');
    });
    /* ========================================================= */
    /* ❌ FIND SESSION FAIL */
    /* ========================================================= */
    it('should propagate findSession error', async () => {
      sessionCtx.sessionToken.verifyRefreshToken.mockReturnValue(mockDecoded);

      sessionCtx.sessionRepo.findSessionBySessionId.mockRejectedValue(new Error('DB read error'));

      await expect(sessionCtx.sessionService.singleLogoutService(mockRefreshToken)).rejects.toThrow('DB read error');

      expect(sessionCtx.sessionRepo.deleteSessionById).not.toHaveBeenCalled();
    });
  });
  /* ========================================================== */
  /* allLogoutService */
  /* ========================================================== */
  describe('allLogoutService ', () => {
    const mockAccessToken = 'access-token';
    const mockaccessDecoded = {
      userId: 'user-1',
      role: UserRole.JOBSEEKER,
    };
    beforeEach(() => {
      jest.clearAllMocks();
    });
    /* ========================================================= */
    /* ✅ SUCCESS CASE */
    /* ========================================================= */
    it('should delete all sessions for user successfully', async () => {
      sessionCtx.sessionToken.verifyAccessToken.mockReturnValue(mockaccessDecoded);
      sessionCtx.sessionRepo.deleteAllSessionsByUserId.mockResolvedValue(undefined);

      const result = await sessionCtx.sessionService.allLogoutService(mockAccessToken);

      expect(sessionCtx.sessionToken.verifyAccessToken).toHaveBeenCalledWith(mockAccessToken);
      expect(sessionCtx.sessionRepo.deleteAllSessionsByUserId).toHaveBeenCalledWith(mockDecoded.userId);
      expect(result).toBeUndefined();
    });
    /* ========================================================= */
    /* ❌ TOKEN VERIFICATION FAIL */
    /* ========================================================= */

    it('should throw if access token verification fails', async () => {
      sessionCtx.sessionToken.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });

      await expect(sessionCtx.sessionService.allLogoutService(mockAccessToken)).rejects.toThrow('Invalid access token');

      expect(sessionCtx.sessionRepo.deleteAllSessionsByUserId).not.toHaveBeenCalled();
    });
    /* ========================================================= */
    /* ❌ DELETE ALL SESSIONS FAIL */
    /* ========================================================= */
    it('should propagate error if deleteAllSessionsByUser fails', async () => {
      sessionCtx.sessionToken.verifyAccessToken.mockReturnValue(mockaccessDecoded);

      sessionCtx.sessionRepo.deleteAllSessionsByUserId.mockRejectedValue(new Error('DB failure'));

      await expect(sessionCtx.sessionService.allLogoutService(mockAccessToken)).rejects.toThrow('DB failure');
    });
  });
});
