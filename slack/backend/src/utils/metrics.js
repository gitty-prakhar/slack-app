import client from 'prom-client';
import responseTime from 'response-time';

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, Memory, etc.)
client.collectDefaultMetrics({
    app: 'slackr-backend',
    prefix: 'node_',
    timeout: 10000,
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    register
});

// Custom metric: HTTP request duration
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000] // bins for ms
});

register.registerMetric(httpRequestDurationMicroseconds);

// Custom metric: Total requests
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code']
});

register.registerMetric(httpRequestsTotal);

/**
 * Middleware to track response times and increment counters
 */
export const metricsMiddleware = responseTime((req, res, time) => {
    if (req.path === '/metrics') return;
    
    // Replace dynamic IDs in path with :id for better metric grouping
    let route = req.path;
    if (req.route && req.route.path) {
        route = req.baseUrl + req.route.path;
    }

    httpRequestDurationMicroseconds
        .labels(req.method, route, res.statusCode)
        .observe(time);

    httpRequestsTotal
        .labels(req.method, route, res.statusCode)
        .inc();
});

export { register };
