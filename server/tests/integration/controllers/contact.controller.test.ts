import request from "supertest";
import app from "../helpers/testApp";

describe("Contact Controller", () => {
  const userData = { username: "testeuser", password: "123456" };
  const name = "teste",
    phone = "5512988776655";
  let token: string;

  beforeEach(async () => {
    // cria o usuário
    await request(app).post("/users").send(userData);
    // efetua o login
    const res = await request(app).post("/users/login").send(userData);
    token = res.body.data.token as string;
  });

  it("deve criar contato com sucesso", async () => {
    const res = await request(app)
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
    await request(app)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, phone });

    await request(app)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "teste2", phone });

    const res = await request(app).get("/contacts").set("Authorization", `Bearer ${token}`);

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
    const created = await request(app)
      .post("/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, phone });

    const id = created.body.data.contact.id;

    const del = await request(app)
      .delete(`/contacts/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app).get("/contacts").set("Authorization", `Bearer ${token}`);
    const exists = (list.body.data.contacts as any[]).find((c) => c.id === id);
    expect(exists).toBeUndefined();
  });

  it("não deve permitir operações sem token", async () => {
    const create = await request(app).post("/contacts").send({ name, phone });
    expect(create.status).toBe(401);

    const list = await request(app).get("/contacts");
    expect(list.status).toBe(401);
  });

  describe("validateBody em createContact", () => {
    it("deve retornar 400 quando name estiver ausente", async () => {
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ phone });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.success).toBe(false);
      expect(resCreate.body.error).toBe("Erro de validação dos campos");
      expect(resCreate.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: name"]));
    });

    it("deve retornar 400 quando phone estiver ausente", async () => {
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: phone"]));
    });

    it("deve validar tamanho mínimo do name (>= 3)", async () => {
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "ab", phone });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(
        expect.arrayContaining(["Campo name deve ter no mínimo 3 caracteres"]),
      );
    });

    it("deve validar tamanho máximo do name (<= 50)", async () => {
      const longName = "a".repeat(51);
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: longName, phone });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(
        expect.arrayContaining(["Campo name deve ter no máximo 50 caracteres"]),
      );
    });

    it("deve validar tipo dos campos (string)", async () => {
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: 123, phone: 456 });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(
        expect.arrayContaining([
          "Campo name deve ser do tipo string",
          "Campo phone deve ser do tipo string",
        ]),
      );
    });

    it("deve validar tamanho mínimo do phone (>= 6)", async () => {
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name, phone: "12345" });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(
        expect.arrayContaining(["Campo phone deve ter no mínimo 6 caracteres"]),
      );
    });

    it("deve validar tamanho máximo do phone (<= 20)", async () => {
      const tooLongPhone = "9".repeat(21);
      const resCreate = await request(app)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name, phone: tooLongPhone });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(
        expect.arrayContaining(["Campo phone deve ter no máximo 20 caracteres"]),
      );
    });
  });
});
