import { Router } from "express";
import { handleChat } from "../controllers/chat.controller.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const router = Router();

// Middleware to optionally authenticate users (so guests can chat, but authenticated users get personalized info)
const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
    } catch (error) {
      // Token is invalid/expired, but we still allow guest access
      console.warn("Optional Auth verification failed:", error.message);
    }
  }
  
  next();
};

router.post("/", optionalProtect, handleChat);

export default router;
