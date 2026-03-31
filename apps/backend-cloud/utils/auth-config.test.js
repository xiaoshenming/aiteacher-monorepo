const test = require("node:test");
const assert = require("node:assert/strict");

const { getJwtSecret } = require("./auth-config");

const LEGACY_DEFAULT_JWT_SECRET = "3a07f8a622d44f6eaf934ca43f8f3d7b";

test("getJwtSecret returns the configured JWT secret", () => {
  assert.equal(getJwtSecret({ JWT_SECRET: "super-secret-value" }), "super-secret-value");
});

test("getJwtSecret rejects a missing JWT secret", () => {
  assert.throws(() => getJwtSecret({}), /JWT_SECRET/);
});

test("getJwtSecret rejects the legacy fallback secret", () => {
  assert.throws(
    () => getJwtSecret({ JWT_SECRET: LEGACY_DEFAULT_JWT_SECRET }),
    /JWT_SECRET/,
  );
});
