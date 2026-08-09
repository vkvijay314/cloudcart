import ExpenseGroup from "../models/expenseGroup.model.js";
import Expense from "../models/expense.model.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";

/* ==============================
   HELPER: EMAILS → USER IDS (GUEST AUTO-CREATION)
 ============================== */
const getUsersByEmails = async (emails) => {
  const users = [];
  for (const email of emails) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) continue;

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // 🌟 Unregistered email: Automatically create a guest placeholder account
      user = await User.create({
        name: cleanEmail.split("@")[0],
        email: cleanEmail,
        provider: "local"
        // password is left undefined
      });
      console.log(`Created guest placeholder account for: ${cleanEmail}`);
    }
    users.push(user);
  }
  return users;
};

/* ==============================
   CREATE GROUP (EMAIL-BASED + INVITE CODE)
 ============================== */
export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, members } = req.body;

  if (!name || !Array.isArray(members) || members.length === 0) {
    return next(new AppError("Group name and member emails required", 400));
  }

  // Get current user to ensure they are added to the group
  const creatorUser = await User.findById(req.user.id);
  if (!creatorUser) {
    return next(new AppError("Authenticated user not found", 404));
  }

  // Merge creator's email into the group members list
  const emailSet = new Set(members.map(e => e.trim().toLowerCase()));
  emailSet.add(creatorUser.email.toLowerCase());
  
  const resolvedEmails = Array.from(emailSet);
  const users = await getUsersByEmails(resolvedEmails);

  // Generate a unique 6-character uppercase Invite Code (e.g. TRIP-A4D1F3 or similar)
  let inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
  let codeExists = await ExpenseGroup.findOne({ inviteCode });
  while (codeExists) {
    inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    codeExists = await ExpenseGroup.findOne({ inviteCode });
  }

  const group = await ExpenseGroup.create({
    name,
    members: users.map(u => u._id),
    createdBy: req.user.id,
    inviteCode
  });

  // Populate members info before returning
  const populatedGroup = await ExpenseGroup.findById(group._id).populate("members", "name email");

  res.status(201).json({ success: true, group: populatedGroup });
});

/* ==============================
   ADD EXPENSE (EMAIL-BASED)
 ============================== */
export const addExpense = asyncHandler(async (req, res, next) => {
  const { groupId, amount, participants, description, paidBy } = req.body;

  if (!groupId || !amount || !participants?.length) {
    return next(new AppError("Missing required fields", 400));
  }

  // Check if group exists
  const group = await ExpenseGroup.findById(groupId);
  if (!group) {
    return next(new AppError("Expense group not found", 404));
  }

  const users = await getUsersByEmails(participants);

  // Determine payer (default to logged-in user if not provided)
  let payerId = req.user.id;
  if (paidBy) {
    const payerUser = await User.findOne({ email: paidBy.toLowerCase() });
    if (!payerUser) {
      return next(new AppError("Payer email is not registered", 400));
    }
    payerId = payerUser._id;
  }

  const expense = await Expense.create({
    group: groupId,
    paidBy: payerId,
    amount,
    participants: users.map(u => u._id),
    description
  });

  res.status(201).json({ success: true, expense });
});

/* ==============================
   GET BALANCES & DEBT SETTLEMENTS
 ============================== */
export const getGroupBalances = asyncHandler(async (req, res, next) => {
  const group = await ExpenseGroup.findById(req.params.groupId).populate("members", "name email");
  if (!group) {
    return next(new AppError("Expense group not found", 404));
  }

  const expenses = await Expense.find({ group: req.params.groupId });

  // Initialize all group members with zero balance
  const balanceMap = {};
  group.members.forEach(member => {
    balanceMap[member._id.toString()] = 0;
  });

  expenses.forEach(exp => {
    const share = exp.amount / exp.participants.length;

    // Deduct share from participants
    exp.participants.forEach(uid => {
      const id = uid.toString();
      // Only deduct if the user is a member of the group currently
      if (id in balanceMap) {
        balanceMap[id] -= share;
      }
    });

    // Add total paid to the payer
    const payer = exp.paidBy.toString();
    if (payer in balanceMap) {
      balanceMap[payer] += exp.amount;
    }
  });

  // Calculate greedy debt settlement minimizer instructions
  const debtorList = [];
  const creditorList = [];

  Object.entries(balanceMap).forEach(([id, bal]) => {
    if (bal < -0.01) {
      debtorList.push({ id, balance: bal });
    } else if (bal > 0.01) {
      creditorList.push({ id, balance: bal });
    }
  });

  // Sort: biggest debts first (most negative first) and biggest credits first
  debtorList.sort((a, b) => a.balance - b.balance);
  creditorList.sort((a, b) => b.balance - a.balance);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtorList.length && cIdx < creditorList.length) {
    const debtor = debtorList[dIdx];
    const creditor = creditorList[cIdx];

    const debtAmount = Math.abs(debtor.balance);
    const creditAmount = creditor.balance;

    const settleAmount = Math.min(debtAmount, creditAmount);

    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: Number(settleAmount.toFixed(2))
    });

    debtor.balance += settleAmount;
    creditor.balance -= settleAmount;

    if (Math.abs(debtor.balance) < 0.01) dIdx++;
    if (creditor.balance < 0.01) cIdx++;
  }

  // Populate names and emails for response
  const userMap = {};
  group.members.forEach(m => {
    userMap[m._id.toString()] = { name: m.name, email: m.email };
  });

  const namedBalances = {};
  Object.entries(balanceMap).forEach(([id, bal]) => {
    const u = userMap[id];
    if (u) {
      namedBalances[u.email] = Number(bal.toFixed(2));
    }
  });

  const populatedSettlements = settlements.map(s => ({
    from: userMap[s.from]?.email || "Unknown User",
    fromName: userMap[s.from]?.name || "Unknown User",
    to: userMap[s.to]?.email || "Unknown User",
    toName: userMap[s.to]?.name || "Unknown User",
    amount: s.amount
  }));

  res.json({ 
    success: true, 
    balance: namedBalances, 
    settlements: populatedSettlements 
  });
});

/* ==============================
   GET GROUPS THE USER IS MEMBER OF
 ============================== */
export const getGroups = asyncHandler(async (req, res, next) => {
  const groups = await ExpenseGroup.find({ members: req.user.id })
    .populate("members", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, groups });
});

/* ==============================
   GET INDIVIDUAL GROUP EXPENSES
 ============================== */
export const getGroupExpenses = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;

  const group = await ExpenseGroup.findById(groupId);
  if (!group) {
    return next(new AppError("Expense group not found", 404));
  }

  const expenses = await Expense.find({ group: groupId })
    .populate("paidBy", "name email")
    .populate("participants", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, expenses });
});

/* ==============================
   JOIN GROUP (VIA INVITE CODE)
 ============================== */
export const joinGroup = asyncHandler(async (req, res, next) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    return next(new AppError("Invite code is required", 400));
  }

  const group = await ExpenseGroup.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
  if (!group) {
    return next(new AppError("Invalid invite code. Group not found.", 404));
  }

  const userId = req.user.id;
  
  // If user is already a member, return success immediately
  if (group.members.includes(userId)) {
    const populatedGroup = await ExpenseGroup.findById(group._id).populate("members", "name email");
    return res.json({ success: true, message: "You are already a member of this group", group: populatedGroup });
  }

  // Add member
  group.members.push(userId);
  await group.save();

  const populatedGroup = await ExpenseGroup.findById(group._id).populate("members", "name email");

  res.json({ success: true, message: "Joined group successfully", group: populatedGroup });
});

/* ==============================
   ADD MEMBER TO GROUP DYNAMICALLY
 ============================== */
export const addMember = asyncHandler(async (req, res, next) => {
  const { groupId, email } = req.body;

  if (!groupId || !email) {
    return next(new AppError("Group ID and member email are required", 400));
  }

  const group = await ExpenseGroup.findById(groupId);
  if (!group) {
    return next(new AppError("Expense group not found", 404));
  }

  // Resolve user (will auto-create guest placeholder if not registered)
  const resolvedUsers = await getUsersByEmails([email]);
  const newUser = resolvedUsers[0];

  if (!newUser) {
    return next(new AppError("Failed to resolve member email", 400));
  }

  // Check if member already in group
  if (group.members.includes(newUser._id)) {
    return next(new AppError("Member is already in the group", 400));
  }

  group.members.push(newUser._id);
  await group.save();

  const populatedGroup = await ExpenseGroup.findById(group._id).populate("members", "name email");

  res.json({ success: true, group: populatedGroup });
});
