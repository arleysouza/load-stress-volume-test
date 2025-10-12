import { validateBody } from "../../../src/middlewares/validateBody";

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

describe("validateBody", () => {
  it("deve retornar 400 se campo obrigatório faltar", () => {
    const middleware = validateBody([{ name: "username", required: true }]);
    const req: any = { body: {} };
    const res = mockRes();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("deve chamar next se os campos forem válidos", () => {
    const middleware = validateBody([{ name: "username", required: true, type: "string" }]);
    const req: any = { body: { username: "ok" } };
    const res = mockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
