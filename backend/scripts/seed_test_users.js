import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Vijay:abcd123@cluster0.yxaue2x.mongodb.net/";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding test users...");

    // Delete existing test users if any
    await User.deleteMany({ email: { $in: ["john@example.com", "jane@example.com"] } });
    console.log("Cleared old test users.");

    const hashed = await bcrypt.hash("password123", 10);
    
    await User.create([
      { name: "John Doe", email: "john@example.com", password: hashed, provider: "local" },
      { name: "Jane Smith", email: "jane@example.com", password: hashed, provider: "local" }
    ]);

    console.log("Seeded test users (John Doe & Jane Smith) successfully with password 'password123'!");
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed test users:", error);
    process.exit(1);
  }
};

seed();
