import Redis from "ioredis";
import dotenv from "dotenv";
import { getRedisUrl } from "./security";

dotenv.config();

const redis = new Redis(getRedisUrl());

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export default redis;
