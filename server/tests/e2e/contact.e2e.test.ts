import request from "supertest";
import dotenv from "dotenv";

dotenv.config(); // garante leitura do .env.e2e dentro do container

describe("Contact E2E Tests", () => {
  const API_BASE_URL = process.env.API_BASE_URL || "";
  const userData = {
    username: `e2euser`,
    password: "123456",
  };
  const name = "teste",
    phone = "5512988776655";
  let token: string;

  beforeEach(async () => {
    // cria o usuário
    await request(API_BASE_URL).post("/users").send(userData);
    // efetua o login
    const res = await request(API_BASE_URL).post("/users/login").send(userData);
    token = res.body.data.token as string;
  });

  it("deve criar contato com sucesso", async () => {
    const res = await request(API_BASE_URL)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, phone });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contact).toEqual(
      expect.objectContaining({ id: expect.any(Number), name, phone }),
    );
  });

  it("deve listar contatos do usuário autenticado", async () => {
    await request(API_BASE_URL)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, phone });

    await request(API_BASE_URL)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "teste2", phone });

    const res = await request(API_BASE_URL)
      .get("/contacts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contacts.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.contacts[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        phone: expect.any(String),
      }),
    );
  });

  it("deve deletar contato do próprio usuário", async () => {
    const created = await request(API_BASE_URL)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, phone });

    const id = created.body.data.contact.id;

    const del = await request(API_BASE_URL)
      .delete(`/contacts/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(API_BASE_URL)
      .get("/contacts")
      .set("Authorization", `Bearer ${token}`);
    const exists = (list.body.data.contacts as any[]).find((c) => c.id === id);
    expect(exists).toBeUndefined();
  });

  it("não deve permitir operações sem token", async () => {
    const create = await request(API_BASE_URL).post("/contacts").send({ name, phone });
    expect(create.status).toBe(401);

    const list = await request(API_BASE_URL).get("/contacts");
    expect(list.status).toBe(401);
  });
});
