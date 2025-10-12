import { Request, Response } from "express";
import db from "../configs/db";
import type { UserPayload } from "../types/express";

// --- Criar contato ---
export const createContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = res.locals.user as UserPayload;
    const { name, phone } = req.body;

    const result = await db.query(
      "INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3) RETURNING id, name, phone",
      [id, name, phone],
    );

    res.status(201).json({
      success: true,
      data: {
        message: "Contato criado com sucesso.",
        contact: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error(error?.message || error);
    res.status(500).json({ success: false, error: "Erro ao criar contato." });
  }
};

// --- Listar contatos do usuário autenticado ---
export const listContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = res.locals.user as UserPayload;
    const result = await db.query(
      "SELECT id, name, phone FROM contacts WHERE user_id = $1 ORDER BY id DESC",
      [id],
    );

    res.status(200).json({
      success: true,
      data: { contacts: result.rows },
    });
  } catch (error: any) {
    console.error(error?.message || error);
    res.status(500).json({ success: false, error: "Erro ao listar contatos." });
  }
};

// --- Deletar contato (somente do próprio usuário) ---
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = res.locals.user as UserPayload;
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, user.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: "Contato não encontrado" });
      return;
    }

    res.status(200).json({
      success: true,
      data: { message: "Contato removido com sucesso." },
    });
  } catch (error: any) {
    console.error(error?.message || error);
    res.status(500).json({ success: false, error: "Erro ao remover contato." });
  }
};
