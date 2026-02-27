import { jest } from '@jest/globals';
import { oauthUserSetUp } from './oauth.test.setup.js';
import { UserRole } from '@/types/role.js';
import { OauthEntity } from '@/modules/oauth/oauth.type.js';

describe('oauth user unit test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  /* ======================================
   CREATE GOOGLE USER
====================================== */
  describe('findOrCreateUserFromGoogle unit test', () => {
    let googleUserOauthCtx: Awaited<ReturnType<typeof oauthUserSetUp>>;

    beforeAll(async () => {
      googleUserOauthCtx = await oauthUserSetUp();
    });

    const mockPayload = {
      sub: 'google123',
      email: 'test@example.com',
      email_verified: true,
      name: 'Test User',
    };
    const mockUserDTO = {
      userId: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      isEmailVerify: false,
      phoneNumber: '',
      role: UserRole.JOBSEEKER,
      createdAt: new Date(),
    };
    const mockOauthEntity: OauthEntity = {
      id: 'oauth-1',
      user_id: 'user-1',
      provider: 'google',
      provider_user_id: 'google123',
      created_at: new Date(),
    };
    const mockUser = {
      user_id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hash-password',
      email_verified: false,
      phone_number: '',
      role: UserRole.JOBSEEKER,
      created_at: new Date(),
    };
    /* ======================================
   CREATE USER IF NOT EXIS
====================================== */
    it('should create new user if not exists', async () => {
      googleUserOauthCtx.oauthRepo.findOauthAccount.mockResolvedValue(null);
      googleUserOauthCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      googleUserOauthCtx.authRepo.createUser.mockResolvedValue(mockUser);
      googleUserOauthCtx.oauthRepo.createOauthAccount.mockResolvedValue(undefined);
      googleUserOauthCtx.authMapper.toUserDTO.mockReturnValue(mockUserDTO);

      const result = await googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle(mockPayload);

      expect(result).toEqual(mockUserDTO);
      expect(googleUserOauthCtx.oauthRepo.findOauthAccount).toHaveBeenCalled();
      expect(googleUserOauthCtx.authRepo.findUserByEmail).toHaveBeenCalledWith(mockPayload.email);
      expect(googleUserOauthCtx.authRepo.createUser).toHaveBeenCalledTimes(1);
      expect(googleUserOauthCtx.oauthRepo.createOauthAccount).toHaveBeenCalledWith(
        mockUser.user_id,
        'google',
        mockPayload.sub,
      );
      expect(googleUserOauthCtx.authMapper.toUserDTO).toHaveBeenCalledTimes(1);
    });
    /* ======================================
   EMAIL NOT EXIST IN PAYLOAD 
====================================== */
    it('should throw if email missing', async () => {
      await expect(
        googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle({ ...mockPayload, email: '' }),
      ).rejects.toThrow();

      expect(googleUserOauthCtx.oauthRepo.findOauthAccount).not.toHaveBeenCalled();
    });
    /* ======================================
   EMAIL NOT VERIFIED IN PAYLOAD 
====================================== */
    it('should throw if email not verify', async () => {
      await expect(
        googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle({ ...mockPayload, email_verified: false }),
      ).rejects.toThrow();
      expect(googleUserOauthCtx.oauthRepo.findOauthAccount).not.toHaveBeenCalled();
    });
    /* ======================================
   EMAIL ALREADY EXIST IN OAUTH DB
====================================== */
    it('should not create new user if user already there', async () => {
      googleUserOauthCtx.oauthRepo.findOauthAccount.mockResolvedValue(mockOauthEntity);
      googleUserOauthCtx.authRepo.findUserByid.mockResolvedValue(mockUser);

      await googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle(mockPayload);

      expect(googleUserOauthCtx.oauthRepo.findOauthAccount).toHaveBeenCalled();
      expect(googleUserOauthCtx.authRepo.findUserByid).toHaveBeenCalled();
      expect(googleUserOauthCtx.authRepo.createUser).not.toHaveBeenCalled();
      expect(googleUserOauthCtx.oauthRepo.createOauthAccount).not.toHaveBeenCalled();
      expect(googleUserOauthCtx.authMapper.toUserDTO).toHaveBeenCalledTimes(1);
      expect(googleUserOauthCtx.authMapper.toUserDTO).toHaveBeenCalledWith(mockUser);
    });

    /* ======================================
   USER EXIST BUT OAUTH NOT HAVE THE USER
====================================== */
    it('should create oauth row but not create user ', async () => {
      googleUserOauthCtx.oauthRepo.findOauthAccount.mockResolvedValue(null);
      googleUserOauthCtx.authRepo.findUserByEmail.mockResolvedValue(mockUser);

      await googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle(mockPayload);

      expect(googleUserOauthCtx.authRepo.createUser).not.toHaveBeenCalled();
      expect(googleUserOauthCtx.oauthRepo.createOauthAccount).toHaveBeenCalledWith(
        mockUser.user_id,
        'google',
        mockPayload.sub,
      );
    });
    /* ======================================
   USER  NOT CREATED
====================================== */
    it('should throw 500 if createUser returns null', async () => {
      googleUserOauthCtx.oauthRepo.findOauthAccount.mockResolvedValue(null);
      googleUserOauthCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      googleUserOauthCtx.authRepo.createUser.mockResolvedValue(null);

      await expect(googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle(mockPayload)).rejects.toThrow(
        'User not created please try again',
      );
    });
    it('should throw 500 if oauth exists but user not found', async () => {
      googleUserOauthCtx.oauthRepo.findOauthAccount.mockResolvedValue(mockOauthEntity);

      googleUserOauthCtx.authRepo.findUserByid.mockResolvedValue(null);

      await expect(googleUserOauthCtx.oauthUserService.findOrCreateUserFromGoogle(mockPayload)).rejects.toThrow(
        'User not created please try again',
      );
    });
  });
});
