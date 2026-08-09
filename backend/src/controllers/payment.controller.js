import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ==============================
   RAZORPAY INSTANCE (FIXED)
============================== */
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

/* ==============================
   CREATE RAZORPAY ORDER
============================== */
export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new AppError("Amount is required", 400));
  }

  const order = await razorpay.orders.create({
    amount: amount * 100, // ₹ → paise
    currency: "INR"
  });

  res.json(order);
});

/* ==============================
   VERIFY RAZORPAY PAYMENT
============================== */
export const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSign = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (expectedSign === razorpay_signature) {
    return res.json({ success: true });
  }

  return next(new AppError("Payment verification failed", 400));
});
