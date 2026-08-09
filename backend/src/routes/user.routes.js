import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/user.controller.js";

const router = Router();

/* Protected route */
router.get("/profile", protect, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed successfully",
    user: req.user
  });
});

/* Wishlist routes */
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist/add", protect, addToWishlist);
router.delete("/wishlist/remove/:productId", protect, removeFromWishlist);

export default router;
