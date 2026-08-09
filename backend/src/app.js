import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";

import { env } from "./config/env.js";

import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import orderRoutes from "./routes/order.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import productRoutes from "./routes/product.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

/* GLOBAL MIDDLEWARES */

// 🔒 Security headers
app.use(helmet());



// 📊 HTTP request logging
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}


// 🔒 CORS — restrict to frontend origin
// Allowed origins for CORS
const allowedOrigins = [
  env.FRONTEND_URL,
  // Allow localhost in development only
  ...(env.NODE_ENV === "development"
    ? ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    : [])
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, server-to-server, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

// 🔒 Global rate limiter (5000 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" }
});
app.use(globalLimiter);

// 🔒 Strict rate limiter for auth routes (10 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again later" }
});
app.use("/api/auth", authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 Prevent NoSQL injection (workaround for Express 5 query getter issue)
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true
  });
  next();
});
app.use(mongoSanitize());

/* ROUTES */
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chat", chatRoutes);

/* ERROR HANDLER (LAST) */
app.use(errorHandler);

export default app;
