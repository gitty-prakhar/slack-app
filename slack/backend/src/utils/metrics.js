import client from 'prom-client';   //prometheus is a monitoring system which is used to monitor the performance of the application
import responseTime from 'response-time';   //calculates how much time it takes to respond on a request

//create a registry or collection of metrics
const register=new client.Registry();

//add default metrics (cpu,memory,etc.)
client.collectDefaultMetrics({
    app:'slackr-backend',
    prefix:'node_',
    timeout:10000,
    gcDurationBuckets:[0.001,0.01,0.1,1,2,5],
    register
});

//custom metric:http request duration
const httpRequestDurationMicroseconds=new client.Histogram({
    name:'http_request_duration_ms',
    help:'duration of http requests in ms',
    labelNames:['method','route','code'],
    buckets:[0.1,5,15,50,100,300,500,1000,3000,5000]
});

register.registerMetric(httpRequestDurationMicroseconds);

//custom metric: Total requests
const httpRequestsTotal=new client.Counter({
    name:'http_requests_total',
    help:'Total number of HTTP requests',
    labelNames:['method','route','code']
});

register.registerMetric(httpRequestsTotal);

//middleware to track response times and increment counters
export const metricsMiddleware=responseTime((req,res,time)=>{
    if(req.path==='/metrics')return;
    
    //replace dynamic id's in path with :id for better metric grouping
    let route=req.path;
    if(req.route&&req.route.path){
        route=req.baseUrl+req.route.path;
    }

    httpRequestDurationMicroseconds
        .labels(req.method,route,res.statusCode)
        .observe(time);

    httpRequestsTotal
        .labels(req.method,route,res.statusCode)
        .inc();
});

export{register};
