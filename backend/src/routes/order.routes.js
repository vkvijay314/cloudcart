import { Router } from "express";
import {
  placeOrder,
  getMyOrders,
  getAllOrders
} from "../controllers/order.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { placeOrderSchema } from "../utils/validation.schemas.js";

const router = Router();

/* USER */
router.post("/", protect, validate(placeOrderSchema), placeOrder);
router.get("/my", protect, getMyOrders);

/* ADMIN */
router.get("/", protect, authorizeRoles("admin"), getAllOrders);

export default router;

