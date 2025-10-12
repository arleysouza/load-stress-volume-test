import {
  createUser,
  loginUser,
  logoutUser,
  changePassword,
} from "../../../src/controllers/user.controller";
import db from "../../../src/configs/db";
import bcrypt from "bcrypt";
import { generateToken } from "../../../src/utils/jwt";
import redisClient from "../../../src/configs/redis";

jest.mock("../../../src/configs/db");
jest.mock("bcrypt");
jest.mock("../../../src/utils/jwt");
jest.mock("../../../src/configs/redis");

const mockReq = (body: any = {}, headers: any = {}) => ({ body, headers }) as any;

const mockRes = () => {
  const res: any = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const username = "teste",
  password = "123456";

describe("User Controller - createUser", () => {
  it("deve criar usuário com sucesso", async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpwd");
    (db.query as jest.Mock).mockResolvedValue({});

    const req = mockReq({ username, password });
    const res = mockRes();

    await createUser(req, res);

    expect(db.query).toHaveBeenCalledWith(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      ["teste", "hashedpwd"],
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("deve retornar 400 em caso de usuário duplicado", async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpwd");
    (db.query as jest.Mock).mockRejectedValue({ code: "23505", message: "Duplicado" });

    const req = mockReq({ username, password });
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("User Controller - loginUser", () => {
  it("deve logar com credenciais válidas", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, username: "teste", password: "hashedpwd" }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateToken as jest.Mock).mockReturnValue("fakeToken");

    const req = mockReq({ username, password });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.any(Object) }),
    );
  });

  it("deve retornar 401 se usuário não existir", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [] });

    const req = mockReq({ username: "naoexiste", password });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("deve retornar 401 se senha for inválida", async () => {
    (db.query as jest.Mock).mockResolvedValue({
      rows: [{ id: 1, username, password: "hashedpwd" }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = mockReq({ username, password: "errada" });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("User Controller - logoutUser", () => {
  it("deve invalidar token com sucesso", async () => {
    const fakeToken = "abc123";
    const fakeHash = "hash123";

    const req = mockReq({}, { authorization: `Bearer ${fakeToken}` });
    const res = mockRes();
    res.locals.user = { exp: Math.floor(Date.now() / 1000) + 3600 } as any;

    jest.spyOn(require("crypto"), "createHash").mockReturnValue({
      update: () => ({ digest: () => fakeHash }),
    } as any);

    (redisClient.setex as jest.Mock).mockResolvedValue("OK");

    await logoutUser(req, res);

    expect(redisClient.setex).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 400 se token não tiver exp", async () => {
    const req = mockReq({}, { authorization: "Bearer abc" });
    const res = mockRes();

    await logoutUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("User Controller - changePassword", () => {
  it("deve alterar senha com sucesso", async () => {
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ password: "hashedold" }] }) // busca senha
      .mockResolvedValueOnce({}); // update
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("newhashed");

    const req = mockReq({ oldPassword: "123456", newPassword: "654321" }, {});
    const res = mockRes();
    res.locals.user = { id: 1 } as any;

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 401 se senha atual for inválida", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [{ password: "hashedpwd" }] });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = mockReq({ oldPassword: "errada", newPassword: "654321" }, {});
    const res = mockRes();
    res.locals.user = { id: 1 } as any;

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("deve retornar 404 se usuário não existir", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [] });

    const req = mockReq({ oldPassword: "123456", newPassword: "654321" }, {});
    const res = mockRes();
    res.locals.user = { id: 999 } as any;

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
