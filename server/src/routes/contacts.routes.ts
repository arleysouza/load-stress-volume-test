import { Router } from "express";
import { validateBody } from "../middlewares/validateBody";
import { createContact, listContacts, deleteContact } from "../controllers/contact.controller";

const router = Router();

// Autenticação é aplicada no roteador raiz (index.ts)

// Criar contato
router.post(
  "/",
  validateBody([
    { name: "name", required: true, type: "string", minLength: 3, maxLength: 50 },
    { name: "phone", required: true, type: "string", minLength: 6, maxLength: 20 },
  ]),
  createContact,
);

// Listar contatos do usuário autenticado
router.get("/", listContacts);

// Deletar contato por id (somente do próprio usuário)
router.delete("/:id", deleteContact);

export default router;
