import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Volume test: foca em grande quantidade de requisições e/ou crescimento de dados.
// Usa constante taxa de chegada (RPS) para garantir volume total ao longo do tempo.

const RATE = Number(__ENV.RATE || 50); // req/s
const DURATION = __ENV.DURATION || "1h"; // ex.: 30m, 1h, 6h
const PREALLOCATED_VUS = Number(__ENV.PREALLOCATED_VUS || 100);
const MAX_VUS = Number(__ENV.MAX_VUS || 500);
const WRITE_RATIO = Number(__ENV.WRITE_RATIO || 0.7); // fração de writes para crescer base

export const options = {
  scenarios: {
    volume: {
      executor: "constant-arrival-rate",
      rate: RATE,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: PREALLOCATED_VUS,
      maxVUs: MAX_VUS,
    },
  },
  thresholds: {
    // Apenas falhas inesperadas
    "http_req_failed{expected_response:false}": ["rate==0"],
    checks: ["rate>0.99"],
    // Durações por endpoint (ajuste conforme SLO)
    "http_req_duration{endpoint:GET_CONTACTS}": ["p(95)<800"],
    "http_req_duration{endpoint:POST_CONTACT}": ["p(95)<1200"],
  },
};

const API = __ENV.API_BASE_URL || "http://localhost:3000";
let vuToken; // cache por VU

function randPhone() {
  const n = Math.floor(100000000 + Math.random() * 899999999);
  return `55${n}`;
}

function ensureAuth() {
  if (vuToken) return true;
  const username = `volume_${__VU}_${Date.now()}`;
  const password = "123456";
  http.post(`${API}/users`, JSON.stringify({ username, password }), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "POST_USERS", phase: "setup", expected_response: "true" },
  });
  const resLogin = http.post(`${API}/users/login`, JSON.stringify({ username, password }), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "POST_LOGIN", phase: "setup" },
  });
  if (resLogin.status === 200) {
    vuToken = resLogin.json("data.token");
    return true;
  }
  return false;
}

export default function () {
  if (!ensureAuth()) {
    sleep(1);
    return;
  }

  const doWrite = Math.random() < WRITE_RATIO;
  const headers = { Authorization: `Bearer ${vuToken}`, "Content-Type": "application/json" };

  if (doWrite) {
    // Crescimento de volume: criar sem deletar
    const body = JSON.stringify({ name: `vol_${Date.now()}`, phone: randPhone() });
    const res = http.post(`${API}/contacts`, body, {
      headers,
      tags: { endpoint: "POST_CONTACT", phase: "main" },
    });
    check(res, { "create 201": (r) => r.status === 201 });
  } else {
    const res = http.get(`${API}/contacts`, {
      headers: { Authorization: `Bearer ${vuToken}` },
      tags: { endpoint: "GET_CONTACTS", phase: "main" },
    });
    check(res, { "list 200": (r) => r.status === 200 });
  }
}

export function handleSummary(data) {
  const base = (__ENV.K6_SCRIPT || "volume.js").replace(/\.js$/, "");
  return {
    [`/results/${base}.summary.json`]: JSON.stringify(data),
    [`/results/${base}.summary.txt`]: textSummary(data, { indent: " ", enableColors: false }),
    [`/results/${base}.summary.html`]: htmlReport(data),
  };
}

