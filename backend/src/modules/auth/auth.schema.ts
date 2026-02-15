import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(3, 'Name must be at least 3 characters'),

  email: z.string({ message: 'Email is required' }).email('Invalid email address'),

  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),

  phoneNumber: z
    .string({ message: 'Phone number is required' })
    .min(1, 'Phone number is required')
    .regex(/^[6-9]\d{9}$/, 'Invalid phone number'),

  role: z.enum(['jobseeker', 'recruiter'], {
    message: 'Role must be either jobseeker or recruiter',
  }),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email({ message: 'Invalid email address' }),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'Invalid token'),
  password: z.string().min(1, 'Password is required'),
});

export const emailVerifySchema = z.object({
  token: z.string().min(32, 'Invalid token'),
});
export const resentEmailVerifySchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Invalid email address'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;
export type ResentEmailVerifySchema = z.infer<typeof resentEmailVerifySchema>;
