import { jest } from '@jest/globals';
import { UserRole } from '@/types/role.js';
import { setupAuthTest } from './auth.test.setup.js';

describe('auth service - unit test', () => {
  let authCtx: Awaited<ReturnType<typeof setupAuthTest>>;

  beforeAll(async () => {
    authCtx = await setupAuthTest();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
  /* =====================================================
    create user
  ===================================================== */
  describe('create user service unit test', () => {
    const mockInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phoneNumber: '9999999999',
      role: UserRole.JOBSEEKER,
    };
    /* =====================================================
     SUCCESS CASE
  ===================================================== */
    it('should successfully create user', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      authCtx.hash.bcryptHash.mockResolvedValue('hash-password');
      authCtx.authRepo.createUser.mockResolvedValue(mockUser);
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.emailService.emailService.sendVarifyEmail.mockResolvedValue(undefined);
      authCtx.emailVerificationRepo.create.mockResolvedValue(undefined);
      authCtx.authMapper.toUserDTO.mockReturnValue(mockUserDTO);

      const result = await authCtx.authService.registerUserService(mockInput);

      expect(authCtx.authRepo.findUserByEmail).toHaveBeenLastCalledWith(mockInput.email);
      expect(authCtx.hash.bcryptHash).toHaveBeenCalledWith(mockInput.password);
      expect(authCtx.authRepo.createUser).toHaveBeenCalledTimes(1);
      expect(authCtx.hash.sha256Hash).toHaveBeenCalledTimes(1);
      expect(authCtx.emailService.emailService.sendVarifyEmail).toHaveBeenCalledTimes(1);
      expect(authCtx.emailVerificationRepo.create).toHaveBeenCalledTimes(1);
      expect(authCtx.authMapper.toUserDTO).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(mockInput.email);
    });
    /* =====================================================
     USER ALREADY EXISTS
  ===================================================== */
    it('should throw  user already exists', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(mockUser);

      await expect(authCtx.authService.registerUserService(mockInput)).rejects.toThrow('User already Exist.');

      expect(authCtx.hash.bcryptHash).not.toHaveBeenCalled();
    });
    /* =====================================================
     CREATE USER FAILS
  ===================================================== */
    it('should throw if user creation fail', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      authCtx.hash.bcryptHash.mockResolvedValue('hash-password');
      authCtx.authRepo.createUser.mockResolvedValue(null);

      await expect(authCtx.authService.registerUserService(mockInput)).rejects.toThrow(
        'An unexpected error occurred. Please try again.',
      );
      expect(authCtx.hash.sha256Hash).not.toHaveBeenCalled();
    });
    /* =====================================================
     EMAIL VERIFICATION FAILS
  ===================================================== */
    it('should throw if email verification creation fails', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      authCtx.hash.bcryptHash.mockResolvedValue('hash-password');
      authCtx.authRepo.createUser.mockResolvedValue(mockUser);
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.emailService.emailService.sendVarifyEmail.mockRejectedValue(new Error('DB error'));

      await expect(authCtx.authService.registerUserService(mockInput)).rejects.toThrow();
    });
    /* =====================================================
     EMAIL SERVICE FAILS
  ===================================================== */
    it('should throw if email sending fails', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      authCtx.hash.bcryptHash.mockResolvedValue('hash-password');
      authCtx.authRepo.createUser.mockResolvedValue(mockUser);
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.emailService.emailService.sendVarifyEmail.mockRejectedValue(new Error('Email Service error'));

      await expect(authCtx.authService.registerUserService(mockInput)).rejects.toThrow();
    });
  });
  /* ======================================
   LOGIN
====================================== */
  describe('login user service unit test', () => {
    const mockLoginInput = {
      email: 'test@example.com',
      password: 'Password123',
    };
    const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    const mockDeviceInfo = 'chrome';
    const mockIpAddress = '127.0.0.0';

    /* ==========================================
     SUCCESS LOGIN
  ========================================== */
    it('should login successfully', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue({ ...mockUser, email_verified: true });
      authCtx.hash.compareBcryptHash.mockResolvedValue(true);
      authCtx.sessionService.createSessionForUser.mockResolvedValue(tokens);

      const result = await authCtx.authService.loginUserService(mockLoginInput, mockDeviceInfo, mockIpAddress);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.userDTO.email).toBe(mockUser.email);
      expect(authCtx.sessionService.createSessionForUser).toHaveBeenCalledTimes(1);
    });
    /* ==========================================
     USER NOT FOUND
  ========================================== */
    it('should throw error if user not found', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);
      await expect(authCtx.authService.loginUserService(mockLoginInput, mockDeviceInfo, mockIpAddress)).rejects.toThrow(
        'Invalid email or password',
      );
      expect(authCtx.sessionService.createSessionForUser).not.toHaveBeenCalled();
    });
    /* ==========================================
     EMAIL NOT VERIFIED
  ========================================== */
    it('should throw  if email not verified', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue({ ...mockUser, email_verified: false });

      await expect(authCtx.authService.loginUserService(mockLoginInput, mockDeviceInfo, mockIpAddress)).rejects.toThrow(
        'Please verify your email first',
      );
      expect(authCtx.sessionService.createSessionForUser).not.toHaveBeenCalled();
    });
    /* ==========================================
     PASSWORD NULL
  ========================================== */
    it('should throw if password is null', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue({ ...mockUser, email_verified: true, password: null });

      await expect(authCtx.authService.loginUserService(mockLoginInput, mockDeviceInfo, mockIpAddress)).rejects.toThrow(
        'Invalid email or password',
      );
      expect(authCtx.sessionService.createSessionForUser).not.toHaveBeenCalled();
    });
    /* ==========================================
     WRONG PASSWORD
  ========================================== */
    it('should throw if password does not match', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue({ ...mockUser, email_verified: true });
      authCtx.hash.compareBcryptHash.mockResolvedValue(false);

      await expect(authCtx.authService.loginUserService(mockLoginInput, mockDeviceInfo, mockIpAddress)).rejects.toThrow(
        'Invalid email or password',
      );
      expect(authCtx.sessionService.createSessionForUser).not.toHaveBeenCalled();
    });
    /* ==========================================
     SESSION CREATION FAILS
  ========================================== */
    it('should throw if session creation fails', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue({ ...mockUser, email_verified: true });
      authCtx.hash.compareBcryptHash.mockResolvedValue(true);
      authCtx.sessionService.createSessionForUser.mockRejectedValue(new Error('Session error'));

      await expect(
        authCtx.authService.loginUserService(mockLoginInput, mockDeviceInfo, mockIpAddress),
      ).rejects.toThrow();
    });
  });
  /* ======================================
   FORGOT PASSOWORD
====================================== */
  describe('forgot password service unit test', () => {
    /* ======================================
   SUCCESS
====================================== */
    it('should send mail for password reset', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(mockUser);
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.passwordResetRepo.create.mockResolvedValue(undefined);
      authCtx.emailService.emailService.sendPasswordResetMail.mockResolvedValue(undefined);

      await authCtx.authService.forgotPasswordService({ email: mockUser.email });

      expect(authCtx.passwordResetRepo.create).toHaveBeenCalled();
      expect(authCtx.emailService.emailService.sendPasswordResetMail).toHaveBeenCalled();
    });
    /* ======================================
   USER NOT EXIST
====================================== */
    it('should silently return if user does not exist', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);

      await expect(authCtx.authService.forgotPasswordService({ email: mockUser.email })).resolves.toBeUndefined();

      expect(authCtx.emailService.emailService.sendPasswordResetMail).not.toHaveBeenCalled();
    });
    /* ======================================
   TOKEN CREATION FAIL
====================================== */
    it('should throw if password varification token creation fail', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(mockUser);
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.passwordResetRepo.create.mockRejectedValue(new Error('DB Error'));

      await expect(authCtx.authService.forgotPasswordService({ email: mockUser.email })).rejects.toThrow();
    });
    /* ======================================
   EMAIL SENDING FAIL
====================================== */
    it('should throw if email sending fails', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(mockUser);
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.passwordResetRepo.create.mockResolvedValue();
      authCtx.emailService.emailService.sendPasswordResetMail.mockRejectedValue(new Error('Email DB Error'));

      await expect(authCtx.authService.forgotPasswordService({ email: mockUser.email })).rejects.toThrow();
    });
  });
  /* ======================================
   RESET PASSWORD
====================================== */
  describe('reset password service unit test', () => {
    const input = {
      token: 'raw-token',
      password: 'NewPassword123',
    };
    const mockRecord = {
      id: 'reset-id',
      user_id: 'user-id',
      token_hash: 'hash-token',
      used: false,
      expires_at: new Date(),
    };
    /* ======================================
     SUCCESS
====================================== */
    it('should reset password successfully', async () => {
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.passwordResetRepo.findByHashToken.mockResolvedValue(mockRecord);
      authCtx.hash.bcryptHash.mockResolvedValue('hash-password');
      authCtx.authRepo.updatePassword.mockResolvedValue(undefined);
      authCtx.passwordResetRepo.markUsed.mockResolvedValue(undefined);
      authCtx.sessionRepo.deleteAllSessionsByUserId.mockResolvedValue(undefined);

      await authCtx.authService.resetPasswordService(input);

      expect(authCtx.passwordResetRepo.findByHashToken).toHaveBeenCalled();
      expect(authCtx.hash.bcryptHash).toHaveBeenCalledWith(input.password);
      expect(authCtx.authRepo.updatePassword).toHaveBeenCalledWith(mockRecord.user_id, 'hash-password');
      expect(authCtx.passwordResetRepo.markUsed).toHaveBeenCalled();
      expect(authCtx.sessionRepo.deleteAllSessionsByUserId).toHaveBeenCalled();
    });
    /* ======================================
     TOKEN NOT EXIST
====================================== */
    it('should throw if token not found', async () => {
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.passwordResetRepo.findByHashToken.mockResolvedValue(null);

      await expect(authCtx.authService.resetPasswordService(input)).rejects.toThrow();
      expect(authCtx.authRepo.updatePassword).not.toHaveBeenCalled();
    });
    /* ======================================
     TOKEN USED
====================================== */
    it('should throw if token already used', async () => {
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.passwordResetRepo.findByHashToken.mockResolvedValue({ ...mockRecord, used: true });

      await expect(authCtx.authService.resetPasswordService(input)).rejects.toThrow();
      expect(authCtx.authRepo.updatePassword).not.toHaveBeenCalled();
    });
  });
  /* ======================================
   EMAIL VERIFY
====================================== */
  describe('email verify service unit test', () => {
    const input = {
      token: 'raw-token',
    };
    const mockRecord = {
      id: 'reset-id',
      user_id: 'user-id',
      token_hash: 'hash-token',
      expires_at: new Date(),
    };
    /* ======================================
     SUCCESS
====================================== */
    it('should successfully mark the email_verify true', async () => {
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.emailVerificationRepo.findByHashToken.mockResolvedValue(mockRecord);
      authCtx.authRepo.markEmailVerified.mockResolvedValue(undefined);
      authCtx.emailVerificationRepo.deleteToken.mockResolvedValue(undefined);

      await authCtx.authService.emailVerifyService(input);

      expect(authCtx.hash.sha256Hash).toHaveBeenCalledWith(input.token);
      expect(authCtx.emailVerificationRepo.findByHashToken).toHaveBeenCalledWith('hash-token');
      expect(authCtx.authRepo.markEmailVerified).toHaveBeenCalled();
      expect(authCtx.emailVerificationRepo.deleteToken).toHaveBeenCalled();
    });
    /* ======================================
     RECORD NOT FOUND
====================================== */
    it('should throw record not found', async () => {
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.emailVerificationRepo.findByHashToken.mockResolvedValue(null);

      await expect(authCtx.authService.emailVerifyService(input)).rejects.toThrow();
      expect(authCtx.authRepo.markEmailVerified).not.toHaveBeenCalled();
    });
    /* ======================================
     MARK EMAIL VERIFY NOT DONE
====================================== */
    it('should throw if mark email verify not done', async () => {
      authCtx.hash.sha256Hash.mockReturnValue('hash-token');
      authCtx.emailVerificationRepo.findByHashToken.mockResolvedValue(mockRecord);
      authCtx.authRepo.markEmailVerified.mockRejectedValue(new Error('DB Error'));

      await expect(authCtx.authService.emailVerifyService(input)).rejects.toThrow();
      expect(authCtx.emailVerificationRepo.deleteToken).not.toHaveBeenCalled();
    });
  });
  /* ======================================
   RESEND EMAIL FOR VERIFICATION
====================================== */
  describe('resend email verification link unit test', () => {
    /* ======================================
   SUCCESS
====================================== */
    it('should resend verification email if user exists and not verified', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(mockUser);
      authCtx.emailVerificationRepo.deleteTokenByUserId.mockResolvedValue(undefined);
      authCtx.hash.sha256Hash.mockReturnValue('token-hash');
      authCtx.emailVerificationRepo.create.mockResolvedValue(undefined);
      authCtx.emailService.emailService.sendVarifyEmail.mockResolvedValue(undefined);

      await authCtx.authService.resentEmailVerification({ email: mockUser.email });

      expect(authCtx.emailVerificationRepo.deleteTokenByUserId).toHaveBeenCalledWith(mockUser.user_id);
      expect(authCtx.emailVerificationRepo.create).toHaveBeenCalled();
      expect(authCtx.emailService.emailService.sendVarifyEmail).toHaveBeenCalled();
    });
    /* ======================================
   USER NOT FOUND
====================================== */
    it('should return silently if user not found', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue(null);

      await authCtx.authService.resentEmailVerification({ email: 'notfound@mail.com' });

      expect(authCtx.emailVerificationRepo.deleteTokenByUserId).not.toHaveBeenCalled();
    });
    /* ======================================
   ALREADY VERIFIED
====================================== */
    it('should return silently if already verified', async () => {
      authCtx.authRepo.findUserByEmail.mockResolvedValue({ ...mockUser, email_verified: true });

      await authCtx.authService.resentEmailVerification({ email: mockUser.email });

      expect(authCtx.emailVerificationRepo.deleteTokenByUserId).not.toHaveBeenCalled();
      expect(authCtx.emailService.emailService.sendVarifyEmail).not.toHaveBeenCalled();
    });
  });
});
