import { Router } from "express";
import {
  createGroup,
  addExpense,
  getGroupBalances,
  getGroups,
  getGroupExpenses,
  joinGroup,
  addMember
} from "../controllers/expense.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createGroupSchema,
  addExpenseSchema
} from "../utils/validation.schemas.js";

const router = Router();

router.use(protect);

router.post("/group", validate(createGroupSchema), createGroup);
router.post("/add", validate(addExpenseSchema), addExpense);
router.get("/balance/:groupId", getGroupBalances);
router.get("/groups", getGroups);
router.get("/group/:groupId", getGroupExpenses);
router.post("/group/join", joinGroup);
router.post("/group/add-member", addMember);

export default router;
