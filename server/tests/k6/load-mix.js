import http from "k6/http";
import { check, sleep, group } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.4/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "3m", target: 100 },
    { duration: "10m", target: 100 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:GET_CONTACTS}": ["p(95)<300"],
    "http_req_duration{endpoint:POST_CONTACT}": ["p(95)<500"],
    "http_req_duration{endpoint:DELETE_CONTACT}": ["p(95)<500"],
    checks: ["rate>0.99"],
  },
};

const API = __ENV.API_BASE_URL || "http://localhost:3000";

export function setup() {
  const username = `load_user_${Date.now()}`;
  const password = "123456";

  let res = http.post(`${API}/users`, JSON.stringify({ username, password }), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "POST_USERS" },
  });
  check(res, { "register 201": (r) => r.status === 201 });

  res = http.post(`${API}/users/login`, JSON.stringify({ username, password }), {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "POST_LOGIN" },
  });
  check(res, { "login 200": (r) => r.status === 200 });

  const token = res.json("data.token");
  return { token };
}

function randPhone() {
  const n = Math.floor(100000000 + Math.random() * 899999999);
  return `55${n}`;
}

function pickWeighted(items) {
  const total = items.reduce((sum, it) => sum + (it.weight || 1), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight || 1;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export default function (data) {
  // Torna o teste resiliente caso setup falhe eventualmente
  let token = data && data.token;
  if (!token) {
    const username = `load_user_${__VU}_${Date.now()}`;
    const password = "123456";
    // Tenta criar usuário (ignora erro de duplicado eventualmente)
    http.post(`${API}/users`, JSON.stringify({ username, password }), {
      headers: { "Content-Type": "application/json" },
      // Registrar pode retornar 201 ou 400 (duplicado) em corridas: não contar como falha de carga
      tags: { endpoint: "POST_USERS", expected_response: "true" },
    });
    const login = http.post(`${API}/users/login`, JSON.stringify({ username, password }), {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "POST_LOGIN" },
    });
    if (login.status === 200) {
      token = login.json("data.token");
    }
  }

  if (!token) {
    // Não prossegue sem token válido nesta iteração
    sleep(1);
    return;
  }

  const auth = { Authorization: `Bearer ${token}` };

  const ops = [
    { name: "GET_CONTACTS", weight: 5 },
    { name: "POST_CONTACT", weight: 3 },
    { name: "DELETE_CONTACT", weight: 2 },
  ];
  const choice = pickWeighted(ops).name;

  if (choice === "GET_CONTACTS") {
    group("List contacts", () => {
      const res = http.get(`${API}/contacts`, {
        headers: auth,
        tags: { endpoint: "GET_CONTACTS" },
      });
      check(res, {
        "list 200": (r) => r.status === 200,
        "list schema": (r) => r.json("data.contacts") !== undefined,
      });
    });
  } else if (choice === "POST_CONTACT") {
    group("Create contact", () => {
      const body = JSON.stringify({ name: `teste_${Date.now()}`, phone: randPhone() });
      const res = http.post(`${API}/contacts`, body, {
        headers: { ...auth, "Content-Type": "application/json" },
        tags: { endpoint: "POST_CONTACT" },
      });
      check(res, {
        "create 201": (r) => r.status === 201,
        "create schema": (r) => r.json("data.contact.id") !== undefined,
      });
      if (res.status === 201) {
        const id = res.json("data.contact.id");
        const del = http.del(`${API}/contacts/${id}`, null, {
          headers: auth,
          // Deletar logo após criar deve ser 200; mas se houver corrida, 404 é aceitável
          tags: { endpoint: "DELETE_CONTACT", expected_response: "true" },
        });
        check(del, { "delete 200/404": (r) => r.status === 200 || r.status === 404 });
      }
    });
  } else {
    group("Delete contact", () => {
      const list = http.get(`${API}/contacts`, {
        headers: auth,
        tags: { endpoint: "GET_CONTACTS" },
      });
      const contacts = list.json("data.contacts") || [];
      if (contacts.length > 0) {
        const id = contacts[0].id;
        const del = http.del(`${API}/contacts/${id}`, null, {
          headers: auth,
          // Em alta concorrência, outro VU pode ter removido; 404 é esperado
          tags: { endpoint: "DELETE_CONTACT", expected_response: "true" },
        });
        check(del, { "delete 200/404": (r) => r.status === 200 || r.status === 404 });
      }
    });
  }

  sleep(0.5);
}

export function handleSummary(data) {
  const base = (__ENV.K6_SCRIPT || "load-mix.js").replace(/\.js$/, "");
  return {
    [`/results/${base}.summary.json`]: JSON.stringify(data),
    [`/results/${base}.summary.txt`]: textSummary(data, { indent: " ", enableColors: false }),
    [`/results/${base}.summary.html`]: htmlReport(data),
  };
}
