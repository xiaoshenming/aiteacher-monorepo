function normalizeEnvValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseRedisPort(rawPort) {
  const normalizedPort = normalizeEnvValue(rawPort);
  const port = Number.parseInt(normalizedPort, 10);

  if (!normalizedPort || Number.isNaN(port) || port <= 0) {
    throw new Error("Redis_PORT 未正确配置");
  }

  return port;
}

function getRedisConnectionOptions(env = process.env) {
  const host = normalizeEnvValue(env.Redis_HOST);

  if (!host) {
    throw new Error("Redis_HOST 未配置");
  }

  return {
    host,
    port: parseRedisPort(env.Redis_PORT),
    password: normalizeEnvValue(env.Redis_PASSWORD) || undefined,
    db: 0,
  };
}

module.exports = {
  getRedisConnectionOptions,
};
