import express from "express";
import user from "./users.routes";
import contacts from "./contacts.routes";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.use("/users", user);
router.use("/contacts", authMiddleware, contacts);

export default router;
