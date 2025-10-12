import { authMiddleware } from "../../../src/middlewares/authMiddleware";
import * as jwtUtils from "../../../src/utils/jwt";
import redisClient from "../../../src/configs/redis";

jest.mock("../../../src/configs/redis");

const mockReq = (headers: any = {}) => ({ headers }) as any;
const mockRes = () => {
  const res: any = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

describe("authMiddleware", () => {
  it("deve retornar 401 se não houver token", async () => {
    const req = mockReq({});
    const res = mockRes();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("deve permitir request válido", async () => {
    (redisClient.get as jest.Mock).mockResolvedValue(null);
    jest.spyOn(jwtUtils, "verifyToken").mockReturnValue({ id: "1", username: "teste" });

    const req = mockReq({ authorization: "Bearer tokenvalido" });
    const res = mockRes();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.locals.user).toEqual({ id: "1", username: "teste" });
  });
});
