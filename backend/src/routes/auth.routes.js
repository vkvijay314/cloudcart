import { Router } from "express";
import {
  register,
  login,
  googleAuth
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../utils/validation.schemas.js";

const router = Router();

/* EMAIL / PASSWORD */
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

/* GOOGLE LOGIN / REGISTER */
router.post("/google", googleAuth);

export default router;

