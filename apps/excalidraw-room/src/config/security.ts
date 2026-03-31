type EnvLike = Record<string, string | undefined>;

export const LEGACY_DEFAULT_JWT_SECRET = "3a07f8a622d44f6eaf934ca43f8f3d7b";
export const LEGACY_DEFAULT_REDIS_URL = "redis://:000000@localhost:6379";

function normalizeEnvValue(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireSecureEnv(name: string, value: string, insecureValues: ReadonlySet<string>): string {
  if (!value) {
    throw new Error(`${name} 未配置`);
  }

  if (insecureValues.has(value)) {
    throw new Error(`${name} 使用了已知不安全的默认值`);
  }

  return value;
}

export function getJwtSecret(env: EnvLike = process.env): string {
  return requireSecureEnv(
    "JWT_SECRET",
    normalizeEnvValue(env.JWT_SECRET),
    new Set([LEGACY_DEFAULT_JWT_SECRET]),
  );
}

export function getRedisUrl(env: EnvLike = process.env): string {
  return requireSecureEnv(
    "REDIS_URL",
    normalizeEnvValue(env.REDIS_URL),
    new Set([LEGACY_DEFAULT_REDIS_URL]),
  );
}
