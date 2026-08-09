import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

/* ==============================
   HELPER: UPLOAD IMAGE
 ============================== */
const uploadImageToCloudinary = async (file) => {
  if (!file) return null;

  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    { folder: "cloudcart-products" }
  );

  return result.secure_url;
};

/* ==============================
   CREATE PRODUCT
 ============================== */
export const createProduct = asyncHandler(async (req, res, next) => {
  const imageUrl = await uploadImageToCloudinary(req.file);

  const product = await Product.create({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    stock: req.body.stock !== undefined ? req.body.stock : 0,
    image: imageUrl,
    createdBy: req.user.id
  });

  res.status(201).json({ success: true, product });
});

/* ==============================
   GET ALL PRODUCTS
 ============================== */
export const getAllProducts = asyncHandler(async (req, res, next) => {
  const { search, category, minPrice, maxPrice, sort } = req.query;

  let query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (category && category !== "All Products") {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let mongooseQuery = Product.find(query);

  if (sort) {
    if (sort === "Price: Low to High") mongooseQuery = mongooseQuery.sort({ price: 1 });
    else if (sort === "Price: High to Low") mongooseQuery = mongooseQuery.sort({ price: -1 });
    else if (sort === "Newest Arrivals") mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
  }

  const products = await mongooseQuery;
  res.json({ success: true, products });
});

/* ==============================
   GET PRODUCT BY ID
 ============================== */
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.json({ success: true, product });
});

/* ==============================
   UPDATE PRODUCT
 ============================== */
export const updateProduct = asyncHandler(async (req, res, next) => {
  const updateData = {
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category
  };

  if (req.body.stock !== undefined) {
    updateData.stock = req.body.stock;
  }

  const imageUrl = await uploadImageToCloudinary(req.file);
  if (imageUrl) updateData.image = imageUrl;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.json({ success: true, product });
});

/* ==============================
   DELETE PRODUCT
 ============================== */
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.json({ success: true, message: "Deleted" });
});
