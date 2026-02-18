const client = require('prom-client');

// 收集默认指标
client.collectDefaultMetrics();

// 自定义指标
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const aiRequestsTotal = new client.Counter({
  name: 'ai_requests_total',
  help: 'Total AI requests',
  labelNames: ['function_name'],
});

const aiTokensConsumed = new client.Counter({
  name: 'ai_tokens_consumed_total',
  help: 'Total AI tokens consumed',
});

const activeWebsocketConnections = new client.Gauge({
  name: 'active_websocket_connections',
  help: 'Active WebSocket connections',
});

function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
}

async function metricsEndpoint(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  aiRequestsTotal,
  aiTokensConsumed,
  activeWebsocketConnections,
};
