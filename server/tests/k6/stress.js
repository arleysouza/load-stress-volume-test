import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "2m", target: 150 },
    { duration: "2m", target: 200 },
    { duration: "2m", target: 250 },
    { duration: "2m", target: 300 },
    { duration: "3m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
  },
};

const API = __ENV.API_BASE_URL || "http://localhost:3000";
let vuToken;

export default function () {
  if (!vuToken) {
    const username = `stress_${__VU}_${Date.now()}`;
    const password = "123456";
    http.post(`${API}/users`, JSON.stringify({ username, password }), {
      headers: { "Content-Type": "application/json" },
    });
    const resLogin = http.post(`${API}/users/login`, JSON.stringify({ username, password }), {
      headers: { "Content-Type": "application/json" },
    });
    if (resLogin.status === 200) vuToken = resLogin.json("data.token");
  }
  if (!vuToken) {
    sleep(1);
    return;
  }

  const res = http.get(`${API}/contacts`, { headers: { Authorization: `Bearer ${vuToken}` } });
  check(res, { 200: (r) => r.status === 200 });
  sleep(0.1);
}

export function handleSummary(data) {
  const base = (__ENV.K6_SCRIPT || "stress.js").replace(/\.js$/, "");
  return {
    [`/results/${base}.summary.json`]: JSON.stringify(data),
    [`/results/${base}.summary.txt`]: textSummary(data, { indent: " ", enableColors: false }),
    [`/results/${base}.summary.html`]: htmlReport(data),
  };
}
