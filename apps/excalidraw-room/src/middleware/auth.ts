import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/security";

export interface JwtPayload {
  id: number;
  role: number;
  device?: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "未提供认证令牌" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      res.status(500).json({ error: "认证服务配置错误" });
      return;
    }

    res.status(401).json({ error: "认证令牌无效或已过期" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = decoded;
  } catch {
    // token 无效时不阻断请求
  }
  next();
}
