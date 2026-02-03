import jwt from "jsonwebtoken";

const jwtSecreate: string = process.env.JWT_ACCESS_SECRET as string;

export const generateAccessToken = (email: string, role: string) => {
  return jwt.sign({ email }, jwtSecreate, { expiresIn: "1h" });
};

export const generateRefreshToken = (email: string) => {
  return jwt.sign({ email }, jwtSecreate, { expiresIn: "7h" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, jwtSecreate);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, jwtSecreate);
};
