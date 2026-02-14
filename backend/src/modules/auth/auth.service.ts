import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/appError.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

//types
import { toUserDTO } from './auth.mapper.js';
import { ForgotPasswordInput, LoginInput, RegisterInput } from './auth.schema.js';
import { LoginResponse, UserDTO } from './auth.types.js';

import * as authRepo from './auth.repository.js';
import * as sessionService from '../session/session.service.js';

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
  if (!user.password) throw new AppError(401, 'Invalid email or password');

  const passMatch = await bcrypt.compare(input.password, user.password);
  if (!passMatch) throw new AppError(401, 'Invalid email or password');

  const userDTO = toUserDTO(user);

  const { accessToken, refreshToken } = await sessionService.createSessionForUser(userDTO, deviceInfo, ipAddress);

  return { userDTO, accessToken, refreshToken };
};

export const forgotPasswordService = async (input: ForgotPasswordInput) => {
  const user = await authRepo.findUserByEmail(input.email);

  if (!user) return;
};
