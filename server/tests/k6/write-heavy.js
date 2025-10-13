import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: "2m", target: 30 },
    { duration: "10m", target: 50 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:POST_CONTACT}": ["p(95)<600"],
  },
};

const API = __ENV.API_BASE_URL || "http://localhost:3000";
let vuToken; // cache por VU

function randPhone() {
  const n = Math.floor(100000000 + Math.random() * 899999999);
  return `55${n}`;
}

export default function () {
  if (!vuToken) {
    const username = `write_${__VU}_${Date.now()}`;
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

  const body = JSON.stringify({ name: `teste_${Date.now()}`, phone: randPhone() });
  const res = http.post(`${API}/contacts`, body, {
    headers: { Authorization: `Bearer ${vuToken}`, "Content-Type": "application/json" },
    tags: { endpoint: "POST_CONTACT" },
  });
  check(res, { 201: (r) => r.status === 201 });
  // Limpeza
  if (res.status === 201) {
    const id = res.json("data.contact.id");
    http.del(`${API}/contacts/${id}`, null, { headers: { Authorization: `Bearer ${vuToken}` } });
  }
  sleep(0.3);
}

export function handleSummary(data) {
  const base = (__ENV.K6_SCRIPT || "write-heavy.js").replace(/\.js$/, "");
  return {
    [`/results/${base}.summary.json`]: JSON.stringify(data),
    [`/results/${base}.summary.txt`]: textSummary(data, { indent: " ", enableColors: false }),
    [`/results/${base}.summary.html`]: htmlReport(data),
  };
}
