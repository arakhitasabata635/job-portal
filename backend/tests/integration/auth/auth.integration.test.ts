import app from '@/app.js';
import request from 'supertest';
import * as hash from '@/shared/helpers/hash.helper.js';
import * as authRepo from '@/modules/auth/auth.repository.js';
import { UserRole } from '@/types/role.js';
import { sql } from '@/config/db.js';
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
  describe('Auth Integration - Login', () => {
    it('should login and create session in DB', async () => {
      const hashedPassword = await hash.bcryptHash(userData.password);
      const user = await authRepo.createUser({ ...userData, password: hashedPassword });
      await authRepo.markEmailVerified(user!.user_id);

      const response = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('userDTO');
      expect(response.body).toBeDefined();
    }, 30000);
  });
});
