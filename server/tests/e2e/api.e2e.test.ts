import request from "supertest";
import dotenv from "dotenv";
dotenv.config();

describe("API E2E Tests - Validações e rotas globais", () => {
  const API_BASE_URL = process.env.API_BASE_URL || "";
  const userData = {
    username: `e2euser`,
    password: "123456",
  };

  it("deve responder com rota não encontrada", async () => {
    const response = await request(API_BASE_URL).get("/rota-invalida");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Rota não encontrada");
  });

  describe("User - Validações de body (validateBody middleware)", () => {
    it("não deve permitir criar usuário sem username", async () => {
      const res = await request(API_BASE_URL).post("/users").send({ password: "123456" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Erro de validação dos campos");
    });

    it("não deve permitir criar usuário sem password", async () => {
      const res = await request(API_BASE_URL).post("/users").send({ username: "incompleteUser" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Erro de validação dos campos");
    });

    it("não deve permitir login sem username", async () => {
      const res = await request(API_BASE_URL).post("/users/login").send({ password: "123456" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Erro de validação dos campos");
    });

    it("não deve permitir login sem password", async () => {
      const res = await request(API_BASE_URL).post("/users/login").send({ username: "anyuser" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Erro de validação dos campos");
    });

    it("não deve permitir alteração de senha sem senha atual", async () => {
      // cria usuário
      await request(API_BASE_URL).post("/users").send(userData);

      // login para obter token
      const loginRes = await request(API_BASE_URL).post("/users/login").send(userData);
      const token = loginRes.body.data.token;

      // altera senha
      const res = await request(API_BASE_URL)
        .patch("/users/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          oldPassword: "123456", // faltando newPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Erro de validação dos campos");
    });

    it("não deve permitir alteração de senha sem nova senha", async () => {
      // cria usuário
      await request(API_BASE_URL).post("/users").send(userData);

      // login para obter token
      const loginRes = await request(API_BASE_URL).post("/users/login").send(userData);
      const token = loginRes.body.data.token;

      // altera senha
      const res = await request(API_BASE_URL)
        .patch("/users/password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          newPassword: "123456", // faltando oldPassword
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Erro de validação dos campos");
    });

    it("não deve permitir alteração de senha sem token", async () => {
      // cria usuário
      await request(API_BASE_URL).post("/users").send(userData);

      // altera senha
      const res = await request(API_BASE_URL).patch("/users/password").send({
        oldPassword: "123456",
        newPassword: "123456",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Token não fornecido");
    });
  });

  describe("Contact - validateBody em createContact", () => {
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

    it("deve retornar 400 quando name estiver ausente", async () => {
      const resCreate = await request(API_BASE_URL)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ phone });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.success).toBe(false);
      expect(resCreate.body.error).toBe("Erro de validação dos campos");
      expect(resCreate.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: name"]));
    });

    it("deve retornar 400 quando phone estiver ausente", async () => {
      const resCreate = await request(API_BASE_URL)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: phone"]));
    });

    it("deve validar tamanho mínimo do name (>= 3)", async () => {
      const resCreate = await request(API_BASE_URL)
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
      const resCreate = await request(API_BASE_URL)
        .post("/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: longName, phone });
      expect(resCreate.status).toBe(400);
      expect(resCreate.body.data).toEqual(
        expect.arrayContaining(["Campo name deve ter no máximo 50 caracteres"]),
      );
    });

    it("deve validar tipo dos campos (string)", async () => {
      const resCreate = await request(API_BASE_URL)
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
      const resCreate = await request(API_BASE_URL)
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
      const resCreate = await request(API_BASE_URL)
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
