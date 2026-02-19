import { nanoid } from "nanoid";
import { randomBytes } from "crypto";
import redis from "../config/redis";

const ROOM_TTL = 7 * 24 * 60 * 60; // 7天

export interface Room {
  id: string;
  title: string;
  creatorId: number;
  creatorName: string;
  roomKey: string;
  createdAt: number;
  lastActiveAt: number;
  isActive: boolean;
  maxMembers: number;
}

function roomKey(roomId: string): string {
  return `excalidraw:room:${roomId}`;
}

function roomMembersKey(roomId: string): string {
  return `excalidraw:room:${roomId}:members`;
}

function userRoomsKey(userId: number): string {
  return `excalidraw:user:${userId}:rooms`;
}

const ACTIVE_ROOMS_KEY = "excalidraw:rooms:active";

function roomToHash(room: Room): Record<string, string> {
  return {
    id: room.id,
    title: room.title,
    creatorId: String(room.creatorId),
    creatorName: room.creatorName,
    roomKey: room.roomKey,
    createdAt: String(room.createdAt),
    lastActiveAt: String(room.lastActiveAt),
    isActive: room.isActive ? "1" : "0",
    maxMembers: String(room.maxMembers),
  };
}

function hashToRoom(hash: Record<string, string>): Room {
  return {
    id: hash.id,
    title: hash.title,
    creatorId: parseInt(hash.creatorId, 10),
    creatorName: hash.creatorName,
    roomKey: hash.roomKey,
    createdAt: parseInt(hash.createdAt, 10),
    lastActiveAt: parseInt(hash.lastActiveAt, 10),
    isActive: hash.isActive === "1",
    maxMembers: parseInt(hash.maxMembers, 10),
  };
}

async function refreshTTL(roomId: string): Promise<void> {
  const now = Date.now();
  const pipeline = redis.pipeline();
  pipeline.hset(roomKey(roomId), "lastActiveAt", String(now));
  pipeline.expire(roomKey(roomId), ROOM_TTL);
  pipeline.expire(roomMembersKey(roomId), ROOM_TTL);
  pipeline.zadd(ACTIVE_ROOMS_KEY, String(now), roomId);
  await pipeline.exec();
}

export async function createRoom(
  creatorId: number,
  creatorName: string,
  title?: string
): Promise<Room> {
  const id = nanoid(12);
  const now = Date.now();
  const room: Room = {
    id,
    title: title || "未命名白板",
    creatorId,
    creatorName,
    roomKey: randomBytes(16).toString("base64url"),
    createdAt: now,
    lastActiveAt: now,
    isActive: true,
    maxMembers: 20,
  };

  const pipeline = redis.pipeline();
  pipeline.hset(roomKey(id), roomToHash(room));
  pipeline.expire(roomKey(id), ROOM_TTL);
  pipeline.sadd(roomMembersKey(id), String(creatorId));
  pipeline.expire(roomMembersKey(id), ROOM_TTL);
  pipeline.sadd(userRoomsKey(creatorId), id);
  pipeline.zadd(ACTIVE_ROOMS_KEY, String(now), id);
  await pipeline.exec();

  return room;
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const data = await redis.hgetall(roomKey(roomId));
  if (!data || !data.id) return null;
  return hashToRoom(data);
}

export async function updateRoom(
  roomId: string,
  updates: Partial<Pick<Room, "title" | "maxMembers" | "isActive">>
): Promise<Room | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const fields: Record<string, string> = {};
  if (updates.title !== undefined) fields.title = updates.title;
  if (updates.maxMembers !== undefined) fields.maxMembers = String(updates.maxMembers);
  if (updates.isActive !== undefined) fields.isActive = updates.isActive ? "1" : "0";

  if (Object.keys(fields).length > 0) {
    await redis.hset(roomKey(roomId), fields);
  }
  await refreshTTL(roomId);

  return { ...room, ...updates };
}

export async function deleteRoom(roomId: string): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room) return false;

  const members = await redis.smembers(roomMembersKey(roomId));
  const pipeline = redis.pipeline();
  pipeline.del(roomKey(roomId));
  pipeline.del(roomMembersKey(roomId));
  pipeline.zrem(ACTIVE_ROOMS_KEY, roomId);
  for (const userId of members) {
    pipeline.srem(userRoomsKey(parseInt(userId, 10)), roomId);
  }
  await pipeline.exec();
  return true;
}

export async function listUserRooms(userId: number): Promise<Room[]> {
  const roomIds = await redis.smembers(userRoomsKey(userId));
  if (roomIds.length === 0) return [];

  const rooms: Room[] = [];
  for (const id of roomIds) {
    const room = await getRoom(id);
    if (room) {
      rooms.push(room);
    } else {
      await redis.srem(userRoomsKey(userId), id);
    }
  }

  rooms.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  return rooms;
}

export async function joinRoom(roomId: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "房间不存在" };
  if (!room.isActive) return { ok: false, error: "房间已关闭" };

  const memberCount = await redis.scard(roomMembersKey(roomId));
  if (memberCount >= room.maxMembers) return { ok: false, error: "房间已满" };

  const pipeline = redis.pipeline();
  pipeline.sadd(roomMembersKey(roomId), String(userId));
  pipeline.sadd(userRoomsKey(userId), roomId);
  await pipeline.exec();

  await refreshTTL(roomId);
  return { ok: true };
}

export async function leaveRoom(roomId: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "房间不存在" };
  if (room.creatorId === userId) return { ok: false, error: "创建者不能离开房间" };

  const pipeline = redis.pipeline();
  pipeline.srem(roomMembersKey(roomId), String(userId));
  pipeline.srem(userRoomsKey(userId), roomId);
  await pipeline.exec();

  return { ok: true };
}

export async function kickMember(roomId: string, userId: number): Promise<{ ok: boolean; error?: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "房间不存在" };
  if (room.creatorId === userId) return { ok: false, error: "不能踢出创建者" };

  const isMember = await redis.sismember(roomMembersKey(roomId), String(userId));
  if (!isMember) return { ok: false, error: "用户不在房间中" };

  const pipeline = redis.pipeline();
  pipeline.srem(roomMembersKey(roomId), String(userId));
  pipeline.srem(userRoomsKey(userId), roomId);
  await pipeline.exec();

  return { ok: true };
}

export async function getRoomMembers(roomId: string): Promise<number[]> {
  const members = await redis.smembers(roomMembersKey(roomId));
  return members.map((id) => parseInt(id, 10));
}

export async function isRoomMember(roomId: string, userId: number): Promise<boolean> {
  return (await redis.sismember(roomMembersKey(roomId), String(userId))) === 1;
}

export { refreshTTL as refreshRoomTTL };
