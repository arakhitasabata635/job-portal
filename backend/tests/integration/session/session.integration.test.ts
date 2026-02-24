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
  beforeAll(async () => {
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
    await sessionRepo.createSession({ sessionId, userId, tokenHash, deviceInfo: 'chrome', ipAddress: '17.0.0.0' });
  });
  afterAll(async () => {
    await sql`
    TRUNCATE TABLE
    refresh_tokens,
    users
    RESTART IDENTITY CASCADE`;
  });
  afterEach(async () => {
    await sql`
    TRUNCATE TABLE
    refresh_tokens,
    users
    RESTART IDENTITY CASCADE`;
  });
  describe('refreshSessionService integration test', () => {
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
  });
});
