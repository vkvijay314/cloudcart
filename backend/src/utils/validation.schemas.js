import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: z.string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email address"),
    password: z.string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" })
      .trim()
      .email("Invalid email address"),
    password: z.string({ required_error: "Password is required" })
      .min(1, "Password is required")
  })
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Product name is required" })
      .trim()
      .min(1, "Product name cannot be empty"),
    price: z.preprocess(
      (val) => Number(val),
      z.number({ required_error: "Price is required" })
        .positive("Price must be a positive number")
    ),
    description: z.string({ required_error: "Description is required" })
      .trim()
      .min(1, "Description cannot be empty"),
    category: z.string({ required_error: "Category is required" })
      .trim()
      .min(1, "Category cannot be empty"),
    stock: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : 0),
      z.number().min(0, "Stock cannot be negative").optional()
    )
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Product name cannot be empty").optional(),
    price: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().positive("Price must be a positive number").optional()
    ),
    description: z.string().trim().optional(),
    category: z.string().trim().min(1, "Category cannot be empty").optional(),
    stock: z.preprocess(
      (val) => (val !== undefined && val !== "" ? Number(val) : undefined),
      z.number().min(0, "Stock cannot be negative").optional()
    )
  })
});

export const placeOrderSchema = z.object({
  body: z.object({
    address: z.object({
      name: z.string({ required_error: "Name is required" }).trim().min(2, "Name must be at least 2 characters"),
      phone: z.string({ required_error: "Phone number is required" }).trim().min(10, "Phone number must be at least 10 digits"),
      line: z.string({ required_error: "Address line is required" }).trim().min(5, "Address must be at least 5 characters"),
      city: z.string({ required_error: "City is required" }).trim().min(2, "City must be at least 2 characters"),
      pincode: z.string({ required_error: "Pincode is required" }).trim().min(6, "Pincode must be at least 6 characters")
    }),
    paymentMethod: z.enum(["COD", "ONLINE"]).optional().default("COD")
  })
});

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }).trim().length(24, "Invalid product ID format"),
    quantity: z.number({ required_error: "Quantity is required" }).positive("Quantity must be a positive number").int("Quantity must be an integer").min(1, "Quantity must be at least 1")
  })
});

export const updateCartQuantitySchema = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }).trim().length(24, "Invalid product ID format"),
    quantity: z.number({ required_error: "Quantity is required" }).positive("Quantity must be a positive number").int("Quantity must be an integer").min(1, "Quantity must be at least 1")
  })
});

export const removeFromCartSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product ID is required" }).trim().length(24, "Invalid product ID format")
  })
});

export const createRazorpayOrderSchema = z.object({
  body: z.object({
    amount: z.number({ required_error: "Amount is required" }).positive("Amount must be positive")
  })
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string({ required_error: "Order ID is required" }).trim().min(1),
    razorpay_payment_id: z.string({ required_error: "Payment ID is required" }).trim().min(1),
    razorpay_signature: z.string({ required_error: "Signature is required" }).trim().min(1)
  })
});

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Group name is required" }).trim().min(2, "Group name must be at least 2 characters"),
    members: z.array(z.string().email("Invalid email address")).min(1, "At least one member is required")
  })
});

export const addExpenseSchema = z.object({
  body: z.object({
    groupId: z.string({ required_error: "Group ID is required" }).trim().length(24, "Invalid group ID format"),
    amount: z.number({ required_error: "Amount is required" }).positive("Amount must be a positive number"),
    participants: z.array(z.string().email("Invalid email address")).min(1, "At least one participant is required"),
    description: z.string().trim().optional(),
    paidBy: z.string().email("Invalid email address").optional()
  })
});
