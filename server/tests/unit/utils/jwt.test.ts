import { generateToken, verifyToken } from "../../../src/utils/jwt";

describe("JWT Utils", () => {
  const payload = { id: "1", username: "teste" };

  it("deve gerar e verificar token", () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it("deve lançar erro para token inválido", () => {
    expect(() => verifyToken("token_invalido")).toThrow();
  });
});
