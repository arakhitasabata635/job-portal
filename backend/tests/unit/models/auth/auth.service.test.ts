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
  /* =====================================================
    create user
  ===================================================== */
  describe('create user service', () => {
    const mockInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phoneNumber: '9999999999',
      role: UserRole.JOBSEEKER,
    };
    const mockUser = {
      user_id: crypto.randomUUID(),
      name: 'Test User',
      email: 'test@example.com',
      email_verified: false,
      phone_number: '9999999999',
      role: UserRole.JOBSEEKER,
      created_at: new Date(),
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

      const result = await authCtx.authService.registerUserService(mockInput);

      expect(authCtx.authRepo.findUserByEmail).toHaveBeenLastCalledWith(mockInput.email);
      expect(authCtx.hash.bcryptHash).toHaveBeenCalledWith(mockInput.password);
      expect(authCtx.authRepo.createUser).toHaveBeenCalledTimes(1);
      expect(authCtx.hash.sha256Hash).toHaveBeenCalledTimes(1);
      expect(authCtx.emailService.emailService.sendVarifyEmail).toHaveBeenCalledTimes(1);
      expect(authCtx.emailVerificationRepo.create).toHaveBeenCalledTimes(1);
      expect(result.email).toBe(mockInput.email);
    });
  });
});
