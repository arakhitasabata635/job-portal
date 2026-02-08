import { Request } from "express";

export const getIp = (req: Request) => {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress ||
    null
  );
};

export const getDeviceInfo = (req: Request) => {
  return req.headers["user-agent"] || "Unknown";
};
