import request from "supertest";
import app from "../helpers/testApp"; // Express app
import crypto from "crypto";

describe("User Controller", () => {
  const userData = { username: "testeuser", password: "123456" };

  it("deve criar usuário com sucesso", async () => {
    const res = await request(app).post("/users").send(userData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Usuário criado com sucesso.");

    const check = await global.pool.query("SELECT * FROM users WHERE username=$1", [
      userData.username,
    ]);
    expect(check.rows.length).toBe(1);
  });

  it("não deve permitir criar usuário duplicado", async () => {
    await request(app).post("/users").send(userData);
    const res = await request(app).post("/users").send(userData);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("deve realizar login e retornar token", async () => {
    await request(app).post("/users").send(userData);

    const res = await request(app).post("/users/login").send(userData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it("deve realizar logout e invalidar token", async () => {
    await request(app).post("/users").send(userData);

    const loginRes = await request(app).post("/users/login").send(userData);
    const token = loginRes.body.data.token;

    const res = await request(app).post("/users/logout").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const blacklisted = await global.redis.get(`blacklist:jwt:${tokenHash}`);
    expect(blacklisted).toBe("true");
  });

  it("deve alterar a senha com sucesso", async () => {
    // cria usuário
    await request(app).post("/users").send(userData);

    // login para obter token
    const loginRes = await request(app).post("/users/login").send(userData);
    const token = loginRes.body.data.token;

    // altera senha
    const res = await request(app)
      .patch("/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "123456",
        newPassword: "654321",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Senha alterada com sucesso");

    // login agora deve funcionar com a nova senha
    const relogin = await request(app).post("/users/login").send({
      username: userData.username,
      password: "654321",
    });

    expect(relogin.status).toBe(200);
    expect(relogin.body.success).toBe(true);
    expect(relogin.body.data.token).toBeDefined();
  });

  it("não deve alterar a senha se a senha atual estiver incorreta", async () => {
    await request(app).post("/users").send(userData);
    const loginRes = await request(app).post("/users/login").send(userData);
    const token = loginRes.body.data.token;

    const res = await request(app)
      .patch("/users/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "senhaErrada",
        newPassword: "654321",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Senha atual incorreta");
  });

  it("não deve alterar a senha se não houver token", async () => {
    await request(app).post("/users").send(userData);

    const res = await request(app).patch("/users/password").send({
      oldPassword: "123456",
      newPassword: "654321",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Token não fornecido");
  });

  describe("validateBody em rotas de usuário", () => {
    describe("POST /users (createUser)", () => {
      it("retorna 400 quando username ausente", async () => {
        const res = await request(app).post("/users").send({ password: "123456" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: username"]));
      });

      it("retorna 400 quando password ausente", async () => {
        const res = await request(app).post("/users").send({ username: "aaabbb" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: password"]));
      });

      it("valida tamanho mínimo de username (>=3)", async () => {
        const res = await request(app).post("/users").send({ username: "ab", password: "123456" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(
          expect.arrayContaining(["Campo username deve ter no mínimo 3 caracteres"]),
        );
      });

      it("valida tamanho mínimo de password (>=6)", async () => {
        const res = await request(app)
          .post("/users")
          .send({ username: "abcdef", password: "12345" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(
          expect.arrayContaining(["Campo password deve ter no mínimo 6 caracteres"]),
        );
      });
    });

    describe("POST /users/login (loginUser)", () => {
      it("retorna 400 quando username ausente", async () => {
        const res = await request(app).post("/users/login").send({ password: "123456" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: username"]));
      });

      it("retorna 400 quando password ausente", async () => {
        const res = await request(app).post("/users/login").send({ username: "abcdef" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: password"]));
      });

      it("valida tipos de username e password (string)", async () => {
        const res = await request(app).post("/users/login").send({ username: 123, password: 456 });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(
          expect.arrayContaining([
            "Campo username deve ser do tipo string",
            "Campo password deve ser do tipo string",
          ]),
        );
      });
    });

    describe("PATCH /users/password (changePassword)", () => {
      let token: string;
      beforeEach(async () => {
        // garantir usuário e token válidos para alcançar o validateBody
        await request(app).post("/users").send({ username: "vbuser", password: "123456" });
        const login = await request(app)
          .post("/users/login")
          .send({ username: "vbuser", password: "123456" });
        token = login.body.data.token;
      });

      it("retorna 400 quando oldPassword ausente", async () => {
        const res = await request(app)
          .patch("/users/password")
          .set("Authorization", `Bearer ${token}`)
          .send({ newPassword: "654321" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: oldPassword"]));
      });

      it("retorna 400 quando newPassword ausente", async () => {
        const res = await request(app)
          .patch("/users/password")
          .set("Authorization", `Bearer ${token}`)
          .send({ oldPassword: "123456" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(expect.arrayContaining(["Campo obrigatório: newPassword"]));
      });

      it("valida tamanho mínimo de newPassword (>=6)", async () => {
        const res = await request(app)
          .patch("/users/password")
          .set("Authorization", `Bearer ${token}`)
          .send({ oldPassword: "123456", newPassword: "12345" });
        expect(res.status).toBe(400);
        expect(res.body.data).toEqual(
          expect.arrayContaining(["Campo newPassword deve ter no mínimo 6 caracteres"]),
        );
      });
    });
  });
});
