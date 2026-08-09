import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ==============================
   GET USER CART
============================== */
export const getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate("items.product");

  res.json({
    success: true,
    cart: cart || { items: [] }
  });
});

/* ==============================
   ADD TO CART
============================== */
export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (quantity > product.stock) {
    return next(new AppError(`Only ${product.stock} items left in stock.`, 400));
  }

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user.id,
      items: [{ product: productId, quantity }]
    });
  } else {
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      if (cart.items[itemIndex].quantity + quantity > product.stock) {
        return next(new AppError(`Cannot add more. Only ${product.stock} items left in stock.`, 400));
      }
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
  }

  // 🔥 IMPORTANT: populate before sending
  const populatedCart = await Cart.findOne({ user: req.user.id })
    .populate("items.product");

  res.json({
    success: true,
    cart: populatedCart
  });
});

/* ==============================
   UPDATE CART QUANTITY
============================== */
export const updateCartQuantity = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity < 1) {
    return next(new AppError("Invalid productId or quantity", 400));
  }

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (quantity > product.stock) {
    return next(new AppError(`Only ${product.stock} items left in stock.`, 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  const item = cart.items.find(
    item => item.product.toString() === productId
  );

  if (!item) {
    return next(new AppError("Item not found in cart", 404));
  }

  item.quantity = quantity;
  await cart.save();

  // 🔥 populate before sending
  const populatedCart = await Cart.findOne({ user: req.user.id })
    .populate("items.product");

  res.json({
    success: true,
    cart: populatedCart
  });
});

/* ==============================
   REMOVE FROM CART
============================== */
export const removeFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );

  await cart.save();

  // 🔥 populate before sending
  const populatedCart = await Cart.findOne({ user: req.user.id })
    .populate("items.product");

  res.json({
    success: true,
    cart: populatedCart
  });
});
