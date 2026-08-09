import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";

/* ==============================
   GET WISHLIST
 ============================== */
export const getWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("wishlist");
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.json({ success: true, wishlist: user.wishlist });
});

/* ==============================
   ADD TO WISHLIST
 ============================== */
export const addToWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!user.wishlist.includes(productId)) {
    user.wishlist.push(productId);
    await user.save();
  }

  const updatedUser = await User.findById(req.user.id).populate("wishlist");
  res.json({ success: true, wishlist: updatedUser.wishlist });
});

/* ==============================
   REMOVE FROM WISHLIST
 ============================== */
export const removeFromWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  const updatedUser = await User.findById(req.user.id).populate("wishlist");
  res.json({ success: true, wishlist: updatedUser.wishlist });
});
