import { jest } from '@jest/globals';

/* ========================================================== */
/* utils unit test */
/* setup */
/* ========================================================== */
async function setupUtilTest() {
  jest.unstable_mockModule('@/shared/helpers/hash.helper.js', () => ({
    sha256Hash: jest.fn(),
  }));

  const hash = await import('@/shared/helpers/hash.helper.js');
  const sessionUtils = await import('@/modules/session/session.utils.js');
  return {
    hash: hash as jest.Mocked<typeof hash>,
    sessionUtils: sessionUtils as jest.Mocked<typeof sessionUtils>,
  };
}

describe('isSessionReuse', () => {
  let sessionUtilCtx: Awaited<ReturnType<typeof setupUtilTest>>;
  beforeAll(async () => {
    sessionUtilCtx = await setupUtilTest();
  });
  const oldRefreshToken = 'old-refresh';
  const mockSession = {
    token_hash: 'oldHash',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  /* ========================================================= */
  /* ❌ SESSION IS NULL → REUSE DETECTED */
  /* ========================================================= */
  it('should throw session reuse detected no session available', () => {
    expect(() => sessionUtilCtx.sessionUtils.isSessionReuse(null, oldRefreshToken)).toThrow('Session reuse detected.');
  });
  /* ========================================================= */
  /* ❌ HASH MISMATCH → REUSE DETECTED */
  /* ========================================================= */
  it('should throw session reuse detect hash mismatch', () => {
    sessionUtilCtx.hash.sha256Hash.mockReturnValue('different hash ');

    expect(() => sessionUtilCtx.sessionUtils.isSessionReuse(mockSession, oldRefreshToken)).toThrow(
      'Session reuse detected.',
    );
    expect(sessionUtilCtx.hash.sha256Hash).toHaveBeenCalledWith(oldRefreshToken);
  });
  /* ========================================================= */
  /* ✅ HASH MATCH → NO ERROR */
  /* ========================================================= */
  it('should not throw if hash matches', () => {
    sessionUtilCtx.hash.sha256Hash.mockReturnValue('oldHash');

    expect(() => sessionUtilCtx.sessionUtils.isSessionReuse(mockSession, oldRefreshToken)).not.toThrow();

    expect(sessionUtilCtx.hash.sha256Hash).toHaveBeenCalledWith(oldRefreshToken);
  });
  /* ========================================================= */
  /* 🔒 ENSURE HASH CALLED ONLY WHEN SESSION EXISTS */
  /* ========================================================= */

  it('should not call hash if session is null', () => {
    try {
      sessionUtilCtx.sessionUtils.isSessionReuse(null, oldRefreshToken);
    } catch {}

    expect(sessionUtilCtx.hash.sha256Hash).not.toHaveBeenCalled();
  });
});
