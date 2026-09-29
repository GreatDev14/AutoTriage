import http from 'k6/http';
import { sleep, check } from 'k6';

// =================================================================================
// 4. SCALING: LOAD TESTING (K6)
// =================================================================================
// The video recommended stress testing the app BEFORE putting it in the hands 
// of real users. This K6 script simulates a massive spike of drivers 
// requesting diagnostic parts pricing simultaneously.

export const options = {
  // Test stages simulate a real-world viral launch spike
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '1m', target: 200 },  // Spike to 200 concurrent users (Load)
    { duration: '30s', target: 500 }, // Mega spike to 500 users (Stress)
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    // 95% of API requests must complete within 200ms
    http_req_duration: ['p(95)<200'], 
    // Less than 1% of requests can fail
    http_req_failed: ['rate<0.01'],   
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // 1. Simulate user loading the main application page
  const mainRes = http.get(`${BASE_URL}/app.html`);
  check(mainRes, {
    'Homepage loaded successfully (200)': (r) => r.status === 200,
  });

  sleep(1); // User reads the page

  // 2. Simulate user typing a query that hits the cached Search API
  const searchQueries = ['brake pads', 'battery', 'alternator', 'spark plugs'];
  const randomQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  
  const searchRes = http.get(`${BASE_URL}/api/search-parts?q=${encodeURIComponent(randomQuery)}&make=Toyota&model=Camry&year=2020`);
  check(searchRes, {
    'Search API responded (200)': (r) => r.status === 200,
    'Search API returned JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  // 3. Simulate triggering a background email job (Async Job Queue Test)
  const payload = JSON.stringify({
    to: "mechanic@example.com",
    subject: "Emergency Diagnostic Request",
    textContent: "A driver needs help nearby."
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const emailRes = http.post(`${BASE_URL}/api/send-email`, payload, params);
  check(emailRes, {
    'Email job queued successfully (202)': (r) => r.status === 202,
  });

  sleep(2); // Wait before next iteration
}

// To run this test locally:
// 1. Start the server: node cluster.js (or node server.js)
// 2. Run k6: k6 run tests/load-test.js
