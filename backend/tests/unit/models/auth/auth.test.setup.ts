import { jest } from '@jest/globals';
export const setupAuthTest = async () => {
  jest.resetModules();
  jest.unstable_mockModule('@/modules/auth/auth.repository.js', () => ({
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
    updatePassword: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/auth/auth.mapper.js', () => ({
    toUserDTO: jest.fn(),
  }));
  jest.unstable_mockModule('@/shared/helpers/hash.helper.js', () => ({
    bcryptHash: jest.fn(),
    compareBcryptHash: jest.fn(),
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
    sendPasswordResetMail: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/session/session.service.js', () => ({
    createSessionForUser: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/session/session.repository.js', () => ({
    deleteAllSessionsByUserId: jest.fn(),
  }));
  jest.unstable_mockModule('@/modules/auth/password-reset.repository.js', () => ({
    create: jest.fn(),
    findByHashToken: jest.fn(),
    markUsed: jest.fn(),
  }));

  const authService = await import('@/modules/auth/auth.service.js');
  const authRepo = await import('@/modules/auth/auth.repository.js');
  const passwordResetRepo = await import('@/modules/auth/password-reset.repository.js');
  const authMapper = await import('@/modules/auth/auth.mapper.js');
  const emailVerificationRepo = await import('@/modules/auth/email-verify.repository.js');
  const emailService = await import('@/modules/email/email.service.js');
  const sessionService = await import('@/modules/session/session.service.js');
  const sessionRepo = await import('@/modules/session/session.repository.js');
  const hash = await import('@/shared/helpers/hash.helper.js');

  return {
    authService,
    authMapper: authMapper as jest.Mocked<typeof authMapper>,
    authRepo: authRepo as jest.Mocked<typeof authRepo>,
    passwordResetRepo: passwordResetRepo as jest.Mocked<typeof passwordResetRepo>,
    emailVerificationRepo: emailVerificationRepo as jest.Mocked<typeof emailVerificationRepo>,
    emailService: emailService as jest.Mocked<typeof emailService>,
    sessionService: sessionService as jest.Mocked<typeof sessionService>,
    sessionRepo: sessionRepo as jest.Mocked<typeof sessionRepo>,
    hash: hash as jest.Mocked<typeof hash>,
  };
};
