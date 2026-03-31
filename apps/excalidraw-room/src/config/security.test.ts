import test from "node:test";
import assert from "node:assert/strict";

import { getJwtSecret, getRedisUrl } from "./security";

const LEGACY_DEFAULT_JWT_SECRET = "3a07f8a622d44f6eaf934ca43f8f3d7b";
const LEGACY_DEFAULT_REDIS_URL = "redis://:000000@localhost:6379";

test("getJwtSecret returns the configured JWT secret", () => {
  assert.equal(getJwtSecret({ JWT_SECRET: "room-secret" }), "room-secret");
});

test("getJwtSecret rejects the legacy fallback secret", () => {
  assert.throws(
    () => getJwtSecret({ JWT_SECRET: LEGACY_DEFAULT_JWT_SECRET }),
    /JWT_SECRET/,
  );
});

test("getRedisUrl returns the configured redis url", () => {
  assert.equal(getRedisUrl({ REDIS_URL: "redis://localhost:6379/0" }), "redis://localhost:6379/0");
});

test("getRedisUrl rejects the legacy fallback redis url", () => {
  assert.throws(
    () => getRedisUrl({ REDIS_URL: LEGACY_DEFAULT_REDIS_URL }),
    /REDIS_URL/,
  );
});
