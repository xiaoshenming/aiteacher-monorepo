import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { JwtPayload } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET || "3a07f8a622d44f6eaf934ca43f8f3d7b";
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("认证令牌无效或已过期"));
  }
}
