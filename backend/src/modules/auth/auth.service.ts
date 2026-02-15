import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

//types
import { toUserDTO } from './auth.mapper.js';
import {
  EmailVerifyInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResentEmailVerifySchema,
  ResetPasswordInput,
} from './auth.schema.js';
import { LoginResponse, UserDTO } from './auth.types.js';

import * as authRepo from './auth.repository.js';
import * as sessionService from '../session/session.service.js';
import * as passwordResetRepo from './password-reset.repository.js';
import * as sessionRepo from '../session/session.repository.js';
import { emailService } from '../email/email.service.js';
import * as emailVerificationRepo from './email-verify.repository.js';

/* ======================================
   REGISTER
====================================== */
export const registerUserService = async (input: RegisterInput): Promise<UserDTO> => {
  const existingUser = await authRepo.findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError(409, 'User already Exist.');
  }

  const hashpassword = await bcrypt.hash(input.password, 10);

  const user = await authRepo.createUser({
    name: input.name,
    email: input.email,
    password: hashpassword,
    phoneNumber: input.phoneNumber,
    role: input.role,
  });
  if (!user) {
    throw new AppError(500, 'An unexpected error occurred. Please try again.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');

  await emailVerificationRepo.create(user.user_id, token_hash);

  //send verify email link
  const verifyLink = `${config.frontend_url}/verify-email?token=${token}`;
  await emailService.sendVarifyEmail(user.email, verifyLink);

  const userDTO = toUserDTO(user);
  return userDTO;
};

/* ======================================
   LOGIN
====================================== */
export const loginUserService = async (
  input: LoginInput,
  deviceInfo: string,
  ipAddress: string | null,
): Promise<LoginResponse> => {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) throw new AppError(401, 'Invalid email or password');
  if (!user.email_verified) {
    throw new Error('Please verify your email first');
  }
  if (!user.password) throw new AppError(401, 'Invalid email or password');

  const passMatch = await bcrypt.compare(input.password, user.password);
  if (!passMatch) throw new AppError(401, 'Invalid email or password');

  const userDTO = toUserDTO(user);

  const { accessToken, refreshToken } = await sessionService.createSessionForUser(userDTO, deviceInfo, ipAddress);

  return { userDTO, accessToken, refreshToken };
};
/* ======================================
   FORGOT PASSOWORD
====================================== */
export const forgotPasswordService = async (input: ForgotPasswordInput) => {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await passwordResetRepo.create(user.user_id, tokenHash);

  //email sent function need

  const resetLink = `${config.frontend_url}/reset-password?token=${rawToken}`;
  await emailService.sendPasswordResetMail(input.email, resetLink);
};

export const resetPasswordService = async (input: ResetPasswordInput) => {
  const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

  const record = await passwordResetRepo.findByHashToken(tokenHash);
  if (!record)
    throw new AppError(404, 'Your reset link is got Expired or Invalid.  Please request a new one to continue.');
  if (record.used)
    throw new AppError(404, 'This link has already been used. If you still need help, request a new link.');

  const hashPassword = await bcrypt.hash(input.password, 10);

  await authRepo.updatePassword(record.user_id, hashPassword);

  await passwordResetRepo.markUsed(record.id);

  await sessionRepo.deleteAllSessionsByUser(record.user_id);
};

export const emailVerifyService = async (input: EmailVerifyInput) => {
  const token_hash = crypto.createHash('sha256').update(input.token).digest('hex');
  const record = await emailVerificationRepo.findByHashToken(token_hash);

  if (!record) throw new AppError(404, 'Your link is got Expired or Invalid.  Please request a new one to continue.');
  await authRepo.markEmailVerified(record.user_id);

  await emailVerificationRepo.deleteToken(token_hash);
};

export const resentEmailVerification = async (input: ResentEmailVerifySchema) => {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) return;
  if (user.email_verified) return;

  await emailVerificationRepo.deleteTokenByUserId(user.user_id);

  const token = crypto.randomBytes(32).toString('hex');
  const token_hash = crypto.createHash('sha256').update(token).digest('hex');

  await emailVerificationRepo.create(user.user_id, token_hash);

  //send verify email link
  const verifyLink = `${config.frontend_url}/verify-email?token=${token}`;
  await emailService.sendVarifyEmail(user.email, verifyLink);
};
