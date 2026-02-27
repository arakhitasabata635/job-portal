import app from '@/app.js';
import request from 'supertest';
import * as hash from '@/shared/helpers/hash.helper.js';
import * as authRepo from '@/modules/auth/auth.repository.js';
import * as passwordResetRepo from '@/modules/auth/password-reset.repository.js';
import * as emailVerificationRepo from '@/modules/auth/email-verify.repository.js';
import * as sessionRepo from '@/modules/session/session.repository.js';
import { UserRole } from '@/types/role.js';
import { sql } from '@/config/db.js';
import crypto from 'crypto';
describe('auth service integrtion test', () => {
  afterAll(async () => {
    await sql`
    TRUNCATE TABLE
      email_verify_tokens,
      password_reset_tokens,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE
  `;
  });
  afterEach(async () => {
    await sql`
    TRUNCATE TABLE
      email_verify_tokens,
      password_reset_tokens,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE
  `;
  });

  const userData = {
    name: 'arakhita',
    email: 'work.arakhita@gmail.com',
    password: 'password123',
    phoneNumber: '9652563545',
    role: UserRole.JOBSEEKER,
  };
  /* =====================================================
     CREATE USER
  ===================================================== */
  describe('create user integration test', () => {
    /* =====================================================
     SUCCESS
  ===================================================== */
    it('should register user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(userData.email);
    }, 30000);
    /* =====================================================
     DUPLICATE EMAIL
  ===================================================== */
    it('should fail if email already exists', async () => {
      await authRepo.createUser(userData);

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
    /* =====================================================
     VALIDATION FAILURE ALL FIELD REQUIRED
  ===================================================== */
    it('should fail if required fields missing', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    /* =====================================================
     INVALID EMAIL FORMAT
  ===================================================== */
    it('should fail for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    /* =====================================================
     WEAK PASSWORD (if zod validates)
  ===================================================== */
    it('should fail for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
  /* =====================================================
     LOGIN USER
  ===================================================== */
  describe('Auth Integration - Login', () => {
    let user: Awaited<ReturnType<typeof authRepo.createUser>>;
    beforeEach(async () => {
      const hashedPassword = await hash.bcryptHash(userData.password);
      user = await authRepo.createUser({ ...userData, password: hashedPassword });
    }, 30000);
    it('should login and create session in DB', async () => {
      await authRepo.markEmailVerified(user!.user_id);

      const res = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('userDTO');
      expect(res.body).toBeDefined();
    }, 30000);
    /* ==========================================
     USER NOT FOUND
  ========================================== */
    it('should fail if user not found', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@gmail.com',
        password: userData.password,
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
    /* ==========================================
    EMAIL NOT VERIFIED
    ========================================== */
    it('should fail if email not verified', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
    /* ==========================================
     WRONG PASSWORD
  ========================================== */
    it('should fail if password incorrect', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: 'pass123456',
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
    /* ==========================================
     VALIDATION ERROR
  ========================================== */
    it('should fail if email missing', async () => {
      const res = await request(app).post('/api/auth/login').send({
        password: 'pass123456',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */
  describe('forgot password integration test', () => {
    let user: Awaited<ReturnType<typeof authRepo.createUser>>;
    beforeEach(async () => {
      const hashedPassword = await hash.bcryptHash(userData.password);
      user = await authRepo.createUser({ ...userData, password: hashedPassword });
    }, 30000);

    /* =====================================================
    SUCCESS
  ===================================================== */
    it('should successfully send the link for forgotpassword', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: userData.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const record = await passwordResetRepo.findByUserId(user!.user_id);

      expect(record?.user_id).toBeDefined();
    });
    /* ==========================================
     EMAIL DOES NOT EXIST (Silent)
  ========================================== */
    it('should still return 200 if email not found', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'unknow@gmail.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const record = await passwordResetRepo.findByUserId(user!.user_id);

      expect(record?.user_id).not.toBeDefined();
    });
    /* ==========================================
     VALIDATION FAILURE
  ========================================== */
    it('should fail if email missing', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({});

      expect(res.status).toBe(400);
    });
  });
  /* =====================================================
     RESET PASSWORD
  ===================================================== */
  describe('reset-password integration test', () => {
    let userId: string;
    let token = crypto.randomBytes(32).toString('hex');
    let password = 'new123456';
    beforeEach(async () => {
      //create user
      const hashedPassword = await hash.bcryptHash(userData.password);
      const user = await authRepo.createUser({ ...userData, password: hashedPassword });
      userId = user?.user_id!;
      //create reset token
      const tokenHash = hash.sha256Hash(token);
      await passwordResetRepo.create(userId, tokenHash);
    }, 30000);

    /* ==========================================
     SUCCESS RESET
  ========================================== */
    it('should reset password successfully', async () => {
      //create session
      await sessionRepo.createSession({
        sessionId: crypto.randomUUID(),
        userId,
        tokenHash: 'hash value ',
        deviceInfo: 'chrome',
        ipAddress: 'ipAddress',
      });

      const res = await request(app).post('/api/auth/reset-password').send({ token, password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // verify password updated
      const user = await authRepo.findUserByid(userId);
      const match = await hash.compareBcryptHash(password, user?.password!);

      expect(match).toBe(true);

      // verify token marked used
      const tokenCheck = await passwordResetRepo.findByUserId(userId);

      expect(tokenCheck?.used).toBe(true);

      // verify sessions deleted
      const sessionCheck = await sessionRepo.findSessionByuserId(userId);

      expect(sessionCheck).toBe(null);
    }, 30000);
    /* ==========================================
     INVALID TOKEN
  ========================================== */
    it('should fail if token invalid', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: crypto.randomBytes(32).toString('hex'), password });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
    /* ==========================================
     TOKEN ALREADY USED
  ========================================== */
    it('should fail if token already used', async () => {
      //markUsed
      const record = await passwordResetRepo.findByUserId(userId);
      await passwordResetRepo.markUsed(record?.id!);

      const res = await request(app).post('/api/auth/reset-password').send({ token, password });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
    /* ==========================================
    VALIDATION FAILURE
    ========================================== */
    it('should fail if password missing', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({ token });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
  /* ======================================
   EMAIL VERIFY
====================================== */
  describe('email verification integration test', () => {
    let userId: string;
    let token = crypto.randomBytes(32).toString('hex');
    beforeEach(async () => {
      //create user
      const hashedPassword = await hash.bcryptHash(userData.password);
      const user = await authRepo.createUser({ ...userData, password: hashedPassword });
      userId = user?.user_id!;
      //create reset token
      const tokenHash = hash.sha256Hash(token);
      await emailVerificationRepo.create(userId, tokenHash);
    }, 30000);
    /* ======================================
   SUCCESS
====================================== */
    it('should verify email successfully', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({ token });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    /* ======================================
   INVALID TOKEN
====================================== */
    it('should fail with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: crypto.randomBytes(32).toString('hex') });

      expect(res.status).toBe(401);
    });
    /* ======================================
   VALIDATION ERROR
====================================== */
    it('should fail with invalid token', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({});

      expect(res.status).toBe(400);
    });
  });
  /* ======================================
   RESEND EMAIL FOR VERIFICATION
====================================== */
  describe('resend email verification link', () => {
    let userId: string;
    beforeEach(async () => {
      //create user
      const hashedPassword = await hash.bcryptHash(userData.password);
      const user = await authRepo.createUser({ ...userData, password: hashedPassword });

      userId = user?.user_id!;
      //create reset token
      let token = crypto.randomBytes(32).toString('hex');
      const tokenHash = hash.sha256Hash(token);
      await emailVerificationRepo.create(user?.user_id!, tokenHash);
    }, 30000);

    /* ======================================
   RESEND EMAIL FOR VERIFICATION
====================================== */
    it('should respond success send link', async () => {
      const res = await request(app).post('/api/auth/resend-verifyEmail').send({ email: userData.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const record = await emailVerificationRepo.findByUserId(userId);

      expect(record?.length).toBe(1);
    });
    /* ======================================
   USER NOT EXIST
====================================== */
    it('should respond success even if user not exists', async () => {
      const res = await request(app).post('/api/auth/resend-verifyEmail').send({ email: userData.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
