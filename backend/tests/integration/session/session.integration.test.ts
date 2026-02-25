import request from 'supertest';
import { sql } from '@/config/db.js';
import * as sessionRepo from '@/modules/session/session.repository.js';
import * as authRepo from '@/modules/auth/auth.repository.js';
import * as hash from '@/shared/helpers/hash.helper.js';
import * as sessionToken from '@/modules/session/auth.token.js';
import { UserRole } from '@/types/role.js';
import app from '@/app.js';
import { config } from '@/config/env.js';

describe('session service integration test', () => {
  let userId: string;
  let sessionId: string;
  let refreshToken: string;
  beforeEach(async () => {
    // clear db
    await sql`
    TRUNCATE TABLE
    refresh_tokens,
    users
    RESTART IDENTITY CASCADE`;
    //create user
    const hashedPassword = await hash.bcryptHash('password');
    const user = await authRepo.createUser({
      name: 'arakhita',
      email: 'work.arakhita@gmail.com',
      password: hashedPassword,
      phoneNumber: '9652563545',
      role: UserRole.JOBSEEKER,
      emailVerified: true,
    });
    userId = user?.user_id!;
    sessionId = crypto.randomUUID();
    const tokens = sessionToken.generateSessionTokens(userId, user?.role!, sessionId);
    refreshToken = tokens.refreshToken;
    const tokenHash = hash.sha256Hash(refreshToken);

    //create session
    await sessionRepo.createSession({ sessionId, userId, tokenHash, deviceInfo: 'chrome', ipAddress: '17.0.0.0' });
  }, 30000);
  afterAll(async () => {
    await sql`
    TRUNCATE TABLE
    refresh_tokens,
    users
    RESTART IDENTITY CASCADE`;
  });
  /* ====================================== */
  /* REFRESH SESSION */
  /* ====================================== */
  describe('POST/api/session/refresh - integration test', () => {
    /* ========================================================= */
    /* ✅ SUCCESS */
    /* ========================================================= */
    it('should rotate refresh token successfully', async () => {
      const res = await request(app)
        .post('/api/session/refresh')
        .set('Cookie', [`${config.jwt.refresh_token.cookie_name} = ${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      // Cookie should be set
      expect(res.headers['set-cookie']).toBeDefined();
      const updateSession = await sessionRepo.findSessionBySessionId(sessionId);

      expect(updateSession?.token_hash).not.toBe(hash.sha256Hash(refreshToken));
    });
    /* ========================================================= */
    /* ❌ NO COOKIE */
    /* ========================================================= */

    it('should fail if no refresh token provide', async () => {
      const res = await request(app).post('/api/session/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
    /* ========================================================= */
    /* ❌ INVALID TOKEN */
    /* ========================================================= */

    it('should fail if refresh token is invalid', async () => {
      const wrongToken = 'wrong-token.hnnt.dsjjj';
      const res = await request(app)
        .post('/api/session/refresh')
        .set('Cookie', [`${config.jwt.refresh_token.cookie_name} = ${wrongToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
    /* ========================================================= */
    /* ❌ SESSION NOT FOUND  REUSE DETECT*/
    /* ========================================================= */
    it('should fail if session does not exist', async () => {
      await sessionRepo.deleteSessionById(sessionId);

      const res = await request(app)
        .post('/api/session/refresh')
        .set('Cookie', [`${config.jwt.refresh_token.cookie_name} = ${refreshToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      const findsessions = await sessionRepo.findSessionByuserId(userId);
      expect(findsessions).toBe(null);
    });
    /* ========================================================= */
    /* ❌ OLD VALID TOKEN  FOUND  REUSE DETECT*/
    /* ========================================================= */
    it('should detect refresh token reuse and delete all sessions', async () => {
      //generate  new token
      const token = sessionToken.generateSessionTokens(userId, UserRole.JOBSEEKER, sessionId);

      const res = await request(app)
        .post('/api/session/refresh')
        .set('Cookie', [`${config.jwt.refresh_token.cookie_name}=${token.refreshToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      const findsessions = await sessionRepo.findSessionByuserId(userId);
      expect(findsessions).toBe(null);
    });
  });
  /* ===================================================== */
  /*  SINGLE LOGOUT */
  /*===================================================== */
  describe('POST/api/session/logout - integration test', () => {
    /* ====================================== */
    /*  SUCCESSFULLY LOGOUT */
    /* ====================================== */
    it('should successfully logout the session', async () => {
      const res = await request(app)
        .post('/api/session/logout')
        .set('Cookie', [`${config.jwt.refresh_token.cookie_name} = ${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logout succefully');

      const session = await sessionRepo.findSessionBySessionId(sessionId);

      expect(session).toBe(null);
    });
    /* ====================================== */
    /*  ALREADY  LOGOUT */
    /* ====================================== */
    it('should return Already logout if session not found', async () => {
      const token = sessionToken.generateSessionTokens(userId, UserRole.JOBSEEKER, crypto.randomUUID());
      const res = await request(app)
        .post('/api/session/logout')
        .set('Cookie', [`${config.jwt.refresh_token.cookie_name} = ${token.refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Already logout');
    });
    /* ====================================== */
    /* NOT HAVE COOKIES */
    /* ====================================== */
    it('should fail if refresh token missing', async () => {
      const res = await request(app).post('/api/session/logout');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
    /* ====================================== */
    /*  INVALID TOKEN */
    /* ====================================== */
    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/session/logout')
        .set('Cookie', `${config.jwt.refresh_token.cookie_name}=invalidtoken`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
  /* =====================================================
      ALL LOGOUT
  ===================================================== */
  describe('POST/api/session/logout-all - integration test', () => {});
});
