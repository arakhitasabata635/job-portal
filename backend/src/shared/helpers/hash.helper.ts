import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const bcryptHash = async (value: string): Promise<string> => {
  const hashValue = await bcrypt.hash(value, 10);
  return hashValue;
};

export const compareBcryptHash = async (value: string, hashValue: string): Promise<boolean> => {
  const result = await bcrypt.compare(value, hashValue);
  return result;
};

export const sha256Hash = (value: string): string => {
  const hashValue = crypto.createHash('sha256').update(value).digest('hex');
  return hashValue;
};
