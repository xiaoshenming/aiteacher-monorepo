const LEGACY_DEFAULT_JWT_SECRET = "3a07f8a622d44f6eaf934ca43f8f3d7b";

function normalizeEnvValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getJwtSecret(env = process.env) {
  const secret = normalizeEnvValue(env.JWT_SECRET);

  if (!secret) {
    throw new Error("JWT_SECRET 未配置，拒绝使用缺省鉴权密钥");
  }

  if (secret === LEGACY_DEFAULT_JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET 使用了已知弱默认值，请在环境变量中重新配置");
  } else if (secret === LEGACY_DEFAULT_JWT_SECRET) {
    console.warn("[auth-config] 警告: JWT_SECRET 使用了已知弱默认值，生产环境请务必更换");
  }

  return secret;
}

module.exports = {
  LEGACY_DEFAULT_JWT_SECRET,
  getJwtSecret,
};
