import { Router } from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addToCartSchema,
  updateCartQuantitySchema,
  removeFromCartSchema
} from "../utils/validation.schemas.js";

const router = Router();

router.use(protect);

router.get("/", getCart);
router.post("/add", validate(addToCartSchema), addToCart);
router.put("/update", validate(updateCartQuantitySchema), updateCartQuantity);
router.delete("/remove", validate(removeFromCartSchema), removeFromCart);

export default router;
