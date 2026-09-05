import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration based on Environment Variable (Baseline, Load, Stress)
const STAGE = __ENV.STAGE || 'baseline';
const BASE_URL = __ENV.BASE_URL || 'https://staging.1learn.asia'; 

// Cảnh báo an toàn: KHÔNG chạy trên Production!
if (BASE_URL.includes('production') || BASE_URL === 'https://1learn.asia') {
    throw new Error("NGUY HIỂM: K6 load test KHÔNG được phép chạy trên Production!");
}

let vus = 10;
let duration = '30s';

if (STAGE === 'load') {
    vus = 50;
    duration = '1m';
} else if (STAGE === 'stress') {
    vus = 100;
    duration = '2m';
}

export const options = {
    vus: vus,
    duration: duration,
    thresholds: {
        // Fast Reads (Explore, Home)
        'http_req_duration{type:fast_read}': ['p(95)<1000'],
        // Critical Writes (Assessment submit)
        'http_req_duration{type:critical_write}': ['p(95)<1500'],
        // Heavy Compute (Match/Report)
        'http_req_duration{type:heavy_compute}': ['p(95)<2500'],
        // Error rate
        http_req_failed: ['rate<0.01'], // < 1% error rate
    },
};

export default function runScenarios() {
    // Traffic Mix Model
    const rand = Math.random(); // 0.0 to 1.0

    if (rand < 0.40) {
        // 40% Explore / Career / Major reads
        let res = http.get(`${BASE_URL}/explore`, { tags: { type: 'fast_read' } });
        check(res, { 'status is 200': (r) => r.status === 200 });
        sleep(randomIntBetween(1, 3));
    } 
    else if (rand < 0.70) {
        // 30% Assessment save/submit
        // In reality, this requires Auth token. For smoke load test, we hit the API.
        const payload = JSON.stringify({ answers: { "Q1": 5, "Q2": 3 } });
        const params = {
            headers: { 'Content-Type': 'application/json' },
            tags: { type: 'critical_write' },
        };
        let res = http.post(`${BASE_URL}/api/assessments/submit`, payload, params);
        // It might return 401 if unauthenticated, but we check latency mostly.
        // Or we pass a valid JWT token via __ENV.
        check(res, { 'responded': (r) => r.status !== 500 });
        sleep(randomIntBetween(2, 5));
    } 
    else if (rand < 0.85) {
        // 15% Student Home / Report
        let res = http.get(`${BASE_URL}/me/kham-pha/report`, { tags: { type: 'heavy_compute' } });
        check(res, { 'responded': (r) => r.status !== 500 });
        sleep(randomIntBetween(1, 3));
    }
    else if (rand < 0.95) {
        // 10% Goal / Journey actions
        let res = http.get(`${BASE_URL}/me/lo-trinh`, { tags: { type: 'fast_read' } });
        check(res, { 'responded': (r) => r.status !== 500 });
        sleep(randomIntBetween(1, 2));
    } 
    else {
        // 5% Parent dashboard
        let res = http.get(`${BASE_URL}/parent`, { tags: { type: 'fast_read' } });
        check(res, { 'responded': (r) => r.status !== 500 });
        sleep(randomIntBetween(1, 4));
    }
}
