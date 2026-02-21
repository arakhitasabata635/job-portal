import { jest } from '@jest/globals';
import { UserDTO } from '@/modules/auth/auth.types.js';
import { setupSessionTest } from './session.test.setup.js';

describe('session service', () => {
  let setup: Awaited<ReturnType<typeof setupSessionTest>>;

  beforeAll(async () => {
    setup = await setupSessionTest();
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

      setup.sessionToken.generateSessionTokens.mockReturnValue({
        accessToken: mockAccess,
        refreshToken: mockRefresh,
      });
      setup.hash.sha256Hash.mockReturnValue(mockHash);
      setup.sessionRepo.createSession.mockResolvedValue(undefined);

      /* act */
      const result = await setup.sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, mockIp);

      /* Assertions */
      expect(setup.sessionToken.generateSessionTokens).toHaveBeenCalledTimes(1);
      expect(setup.sessionToken.generateSessionTokens).toHaveBeenCalledWith(
        mockUserDTO.userId,
        mockUserDTO.role,
        expect.any(String),
      );
      expect(setup.hash.sha256Hash).toHaveBeenCalledWith(mockRefresh);
      expect(setup.sessionRepo.createSession).toHaveBeenCalledWith({
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
  });
});
