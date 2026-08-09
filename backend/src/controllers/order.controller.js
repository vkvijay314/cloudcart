import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ==============================
   PLACE ORDER
 ============================== */
export const placeOrder = asyncHandler(async (req, res, next) => {
  // 🔐 safety guard
  if (!req.user || !req.user.id) {
    return next(new AppError("Unauthorized", 401));
  }

  const { address, paymentMethod } = req.body;

  const cart = await Cart.findOne({ user: req.user.id })
    .populate("items.product");

  if (!cart || !cart.items || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  // ✅ sanitize cart items & check stock
  const items = [];
  
  for (const item of cart.items) {
    if (item.product && item.quantity > 0) {
      if (item.product.stock < item.quantity) {
        return next(new AppError(`Item '${item.product.name}' is out of stock. Available: ${item.product.stock}`, 400));
      }

      items.push({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      });
    }
  }

  if (items.length === 0) {
    return next(new AppError("Invalid cart items", 400));
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = await Order.create({
    user: req.user.id,
    items,
    totalAmount,
    address: address || undefined,
    paymentMethod: paymentMethod || "COD"
  });

  // ✅ Deduct stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  // ✅ clear cart after successful order
  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order
  });
});

/* ==============================
   GET USER ORDERS
 ============================== */
export const getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("items.product", "name image price")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    orders
  });
});

/* ==============================
   ADMIN: GET ALL ORDERS
 ============================== */
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    orders
  });
});
