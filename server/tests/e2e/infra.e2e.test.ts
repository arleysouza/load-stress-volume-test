import request from "supertest";
import dotenv from "dotenv";
import { Client } from "pg";
import Redis from "ioredis";

dotenv.config();

describe("Infrastructure E2E Tests", () => {
  const API_BASE_URL = process.env.API_BASE_URL || "";

  it("deve responder ao health check da API", async () => {
    const res = await request(API_BASE_URL).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("deve ter conectividade com o PostgreSQL", async () => {
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_NAME,
    });

    try {
      await client.connect();
      const res = await client.query("SELECT 1 as connected");
      expect(res.rows[0].connected).toBe(1);
    } finally {
      await client.end();
    }
  });

  it("deve ter conectividade com o Redis", async () => {
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });

    try {
      const pong = await redis.ping();
      expect(pong).toBe("PONG");
    } finally {
      await redis.quit();
    }
  });
});
