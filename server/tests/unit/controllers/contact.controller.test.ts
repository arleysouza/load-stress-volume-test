import {
  createContact,
  listContacts,
  deleteContact,
} from "../../../src/controllers/contact.controller";
import db from "../../../src/configs/db";

jest.mock("../../../src/configs/db");

const mockReq = (body: any = {}, params: any = {}, _user: any = {}, headers: any = {}) =>
  ({ body, params, headers }) as any;

const mockRes = () => {
  const res: any = { locals: {} };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const name = "teste",
  phone = "12988776655";

describe("Contact Controller - createContact", () => {
  it("deve criar contato com sucesso", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, name, phone }] });

    const req = mockReq({ name: "teste", phone: "123456" }, {});
    const res = mockRes();
    res.locals.user = { id: 1 } as any;

    await createContact(req, res);

    expect(db.query).toHaveBeenCalledWith(
      "INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3) RETURNING id, name, phone",
      [1, "teste", "123456"],
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe("Contact Controller - listContacts", () => {
  it("deve listar contatos do usuário", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, name, phone }] });

    const req = mockReq({}, {});
    const res = mockRes();
    res.locals.user = { id: 1 } as any;

    await listContacts(req, res);

    expect(db.query).toHaveBeenCalledWith(
      "SELECT id, name, phone FROM contacts WHERE user_id = $1 ORDER BY id DESC",
      [1],
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe("Contact Controller - deleteContact", () => {
  it("deve deletar contato do próprio usuário", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

    const req = mockReq({}, { id: "1" });
    const res = mockRes();
    res.locals.user = { id: 1 } as any;

    await deleteContact(req, res);

    expect(db.query).toHaveBeenCalledWith(
      "DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id",
      ["1", 1],
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar 404 quando contato não for encontrado", async () => {
    (db.query as jest.Mock).mockResolvedValue({ rows: [] });

    const req = mockReq({}, { id: "999" });
    const res = mockRes();
    res.locals.user = { id: 1 } as any;

    await deleteContact(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
