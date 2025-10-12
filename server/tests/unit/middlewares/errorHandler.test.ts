import { errorHandler } from "../../../src/middlewares/errorHandler";

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler middleware", () => {
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // silencia logs
  });

  afterAll(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("deve retornar 500 e mensagem genérica em produção", () => {
    process.env.NODE_ENV = "production"; // simula ambiente prod
    const err = new Error("Erro interno");
    const res = mockRes();

    errorHandler(err, {} as any, res, {} as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Erro interno do servidor",
    });
  });

  it("deve incluir detalhes do erro em ambiente não produção", () => {
    process.env.NODE_ENV = "test"; // simula ambiente dev/test
    const err = new Error("Falha simulada");
    const res = mockRes();

    errorHandler(err, {} as any, res, {} as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Erro interno do servidor",
        details: "Falha simulada",
      }),
    );
  });
});
