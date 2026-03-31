import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JwtPayload } from "./auth";
import { getJwtSecret } from "../config/security";

const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void): void {
  if (!REQUIRE_AUTH) {
    next();
    return;
  }

  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error("未提供认证令牌"));
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    socket.data.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      next(new Error("认证服务配置错误"));
      return;
    }

    next(new Error("认证令牌无效或已过期"));
  }
}
