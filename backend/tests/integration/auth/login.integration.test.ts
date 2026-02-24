import app from '@/app.js';
import request from 'supertest';
import * as hash from '@/shared/helpers/hash.helper.js';
import * as authRepo from '@/modules/auth/auth.repository.js';
import { UserRole } from '@/types/role.js';
import { sql } from '@/config/db.js';

describe('Auth Integration - Login', () => {
  afterAll(async () => {
    await sql`
    TRUNCATE TABLE
      email_verify_tokens,
      password_reset_tokens,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE
  `;
    console.log('Integration tests completed');
  });
  beforeEach(async () => {
    await sql`
    TRUNCATE TABLE
      email_verify_tokens,
      password_reset_tokens,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE
  `;
  });
  it('should login and create session in DB', async () => {
    const hashedPassword = await hash.bcryptHash('arakhita');
    await authRepo.createUser({
      name: 'arakhita',
      email: 'work.arakhita@gmail.com',
      password: hashedPassword,
      phoneNumber: '9652563545',
      role: UserRole.JOBSEEKER,
      emailVerified: true,
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'work.arakhita@gmail.com',
      password: 'arakhita',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('userDTO');
    expect(response.body).toBeDefined();
  });
});
