import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  // ADD THESE (THIS WAS MISSING)
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
  CLOUDINARY_KEY: process.env.CLOUDINARY_KEY,
  CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,
   // ADD THESE
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173"
};

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "CLOUDINARY_NAME",
  "CLOUDINARY_KEY",
  "CLOUDINARY_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "GOOGLE_CLIENT_ID"
];

const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(`\x1b[31m❌ Critical missing environment variables: ${missingEnv.join(", ")}\x1b[0m`);
  process.exit(1);
}

if (!env.GEMINI_API_KEY) {
  console.warn("\x1b[33m⚠️ Warning: GEMINI_API_KEY is not set. Chatbot will run in Demo Mode.\x1b[0m");
}

