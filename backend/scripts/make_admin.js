import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import User from "../src/models/user.model.js";

async function makeAdmin() {
  await connectDB();
  const user = await User.findOne({ email: "admin@cloudcart.com" });
  if (user) {
    user.role = "admin";
    await user.save();
    console.log("Admin updated");
  } else {
    console.log("Admin not found, register first");
  }
  process.exit();
}
makeAdmin();
