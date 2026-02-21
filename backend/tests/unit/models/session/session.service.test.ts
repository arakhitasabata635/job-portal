import { UserDTO } from '@/modules/auth/auth.types.js';
import { setupSessionTest } from './session.test.setup.js';

describe('create session for user', () => {
  let sessionRepo: any;
  let hash: any;
  let sessionToken: any;
  let sessionService: any;

  beforeAll(async () => {
    const setup = await setupSessionTest();
    sessionRepo = setup.sessionRepo;
    hash = setup.hash;
    sessionToken = setup.sessionToken;
    sessionService = setup.sessionService;
  });

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

    (sessionToken.generateSessionTokens as jest.Mock).mockReturnValue({
      accessToken: mockAccess,
      refreshToken: mockRefresh,
    });
    (hash.sha256Hash as jest.Mock).mockReturnValue(mockHash);
    (sessionRepo.createSession as jest.Mock).mockReturnValue(undefined);

    /* act */
    const result = await sessionService.createSessionForUser(mockUserDTO, mockDeviceInfo, mockIp);

    /* Assertions */
    expect(sessionToken.generateSessionTokens).toHaveBeenCalledTimes(1);
    expect(sessionToken.generateSessionTokens).toHaveBeenCalledWith(
      mockUserDTO.userId,
      mockUserDTO.role,
      expect.any(String),
    );
    expect(hash.sha256Hash).toHaveBeenCalledWith(mockRefresh);
    expect(sessionRepo.createSession).toHaveBeenCalledWith({
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
