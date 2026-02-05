import jwt from "jsonwebtoken";

const jwtSecreate: string = process.env.JWT_ACCESS_SECRET as string;
const refreshSecret = process.env.JWT_REFRESH_SECRET as string;

export const generateAccessToken = (
  id: number,
  email: string,
  role: string,
) => {
  return jwt.sign({ id, email, role }, jwtSecreate, { expiresIn: "1h" });
};

export const generateRefreshToken = (id: number, email: string) => {
  return jwt.sign({ id, email }, refreshSecret, { expiresIn: "7h" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, jwtSecreate);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret);
};
