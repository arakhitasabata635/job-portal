import { jest } from '@jest/globals';
export const setupAuthTest = async () => {
  jest.resetModules();
  jest.unstable_mockModule('@/modules/auth/auth.repository.js', () => ({
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/auth/auth.mapper.js', () => ({
    toUserDTO: jest.fn(),
  }));
  jest.unstable_mockModule('@/shared/helpers/hash.helper.js', () => ({
    bcryptHash: jest.fn(),
    sha256Hash: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/email/email.service.js', () => ({
    emailService: {
      sendPasswordResetMail: jest.fn(),
      sendVarifyEmail: jest.fn(),
    },
  }));
  jest.unstable_mockModule('@/modules/auth/email-verify.repository.js', () => ({
    create: jest.fn(),
  }));

  const authService = await import('@/modules/auth/auth.service.js');
  const authRepo = await import('@/modules/auth/auth.repository.js');
  const authMapper = await import('@/modules/auth/auth.mapper.js');
  const emailVerificationRepo = await import('@/modules/auth/email-verify.repository.js');
  const emailService = await import('@/modules/email/email.service.js');
  const hash = await import('@/shared/helpers/hash.helper.js');

  return {
    authService,
    authMapper: authMapper as jest.Mocked<typeof authMapper>,
    authRepo: authRepo as jest.Mocked<typeof authRepo>,
    emailVerificationRepo: emailVerificationRepo as jest.Mocked<typeof emailVerificationRepo>,
    emailService: emailService as jest.Mocked<typeof emailService>,
    hash: hash as jest.Mocked<typeof hash>,
  };
};
