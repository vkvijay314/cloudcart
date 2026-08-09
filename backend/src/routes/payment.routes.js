import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema
} from "../utils/validation.schemas.js";

const router = express.Router();

router.post("/create", protect, validate(createRazorpayOrderSchema), createRazorpayOrder);
router.post("/verify", protect, validate(verifyRazorpayPaymentSchema), verifyRazorpayPayment);

export default router;
