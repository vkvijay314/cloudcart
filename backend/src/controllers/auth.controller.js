import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import { generateToken } from "../utils/token.js";
import { env } from "../config/env.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ===============================
   GOOGLE CLIENT
 ================================ */
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/* ===============================
   REGISTER (EMAIL / PASSWORD)
 ================================ */
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email }).select("+password");
  if (existingUser) {
    if (!existingUser.password) {
      // 🌟 Guest placeholder account! Claim it by upgrading to a real account
      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.provider = "local";
      await existingUser.save();

      const token = generateToken({
        id: existingUser._id,
        role: existingUser.role
      });

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        }
      });
    } else {
      return next(new AppError("User already exists", 400));
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔒 Always force role to "user" — never trust client-provided role
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    provider: "local",
    role: "user"
  });

  const token = generateToken({
    id: user._id,
    role: user.role
  });

  return res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

/* ===============================
   LOGIN (EMAIL / PASSWORD)
 ================================ */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  const token = generateToken({
    id: user._id,
    role: user.role
  });

  return res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

/* ===============================
   GOOGLE LOGIN / REGISTER
 ================================ */
export const googleAuth = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError("Google token missing", 400));
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID
    });
  } catch (error) {
    return next(new AppError("Google authentication failed", 401));
  }

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  let user = await User.findOne({ email });

  // 🔹 Auto-register if new user
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      provider: "google"
    });
  }

  const jwtToken = generateToken({
    id: user._id,
    role: user.role
  });

  return res.status(200).json({
    success: true,
    token: jwtToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});

