import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/product.model.js";

dotenv.config();

import User from "./src/models/user.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Vijay:abcd123@cluster0.yxaue2x.mongodb.net/";

const seedProducts = [
  {
    name: "Apple iPhone 15 Pro",
    description: "The latest iPhone with A17 Pro chip and titanium design.",
    price: 999,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569"],
    stock: 50,
  },
  {
    name: "Sony WH-1000XM5 Headphones",
    description: "Industry-leading noise canceling wireless headphones.",
    price: 348,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb"],
    stock: 100,
  },
  {
    name: "Nike Air Force 1",
    description: "Classic streetwear sneakers for everyday use.",
    price: 110,
    category: "Clothing",
    images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a"],
    stock: 200,
  },
  {
    name: "MacBook Air M2",
    description: "Supercharged by M2 chip. 13.6-inch Liquid Retina display.",
    price: 1199,
    category: "Electronics",
    images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8"],
    stock: 30,
  },
];

const runSeeder = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Create a dummy admin user
    let admin = await User.findOne({ email: "admin@seed.com" });
    if (!admin) {
      admin = await User.create({
        name: "Admin User",
        email: "admin@seed.com",
        password: "password123", // Doesn't matter since it's just for seeder reference, we won't login with this directly without hash
        role: "admin",
        provider: "local"
      });
      console.log("Created dummy admin user.");
    }

    const productsWithAdmin = seedProducts.map(p => ({ ...p, createdBy: admin._id }));

    // Clear existing products
    await Product.deleteMany();
    console.log("Cleared existing products.");

    // Insert new products
    await Product.insertMany(productsWithAdmin);
    console.log("Seeded database with new products!");

    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

runSeeder();
