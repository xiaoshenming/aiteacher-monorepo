const test = require("node:test");
const assert = require("node:assert/strict");

const { getRedisConnectionOptions } = require("./redis-config");

test("getRedisConnectionOptions returns normalized redis connection options", () => {
  assert.deepEqual(
    getRedisConnectionOptions({
      Redis_HOST: "127.0.0.1",
      Redis_PORT: "6379",
      Redis_PASSWORD: "secret",
    }),
    {
      host: "127.0.0.1",
      port: 6379,
      password: "secret",
      db: 0,
    },
  );
});

test("getRedisConnectionOptions rejects a missing redis host", () => {
  assert.throws(
    () => getRedisConnectionOptions({ Redis_PORT: "6379" }),
    /Redis_HOST/,
  );
});

test("getRedisConnectionOptions rejects a non-numeric redis port", () => {
  assert.throws(
    () => getRedisConnectionOptions({ Redis_HOST: "127.0.0.1", Redis_PORT: "abc" }),
    /Redis_PORT/,
  );
});
