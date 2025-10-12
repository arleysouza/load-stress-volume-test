import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const host = process.env.POSTGRES_HOST || "127.0.0.1";
const port = Number(process.env.POSTGRES_PORT || 5433);
const user = process.env.POSTGRES_USER;
const password = String(process.env.POSTGRES_PASSWORD || "");
const database = process.env.POSTGRES_DB;

// Reutiliza uma instância única do Pool (inclusive em testes)
const g = global as unknown as { __APP_POOL?: Pool };

const pool: Pool = g.__APP_POOL ?? new Pool({ host, user, password, database, port });

// Armazena no escopo global para reutilização entre imports/processos de teste
g.__APP_POOL = pool;

export default pool;
