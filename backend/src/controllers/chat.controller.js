import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";

export const handleChat = asyncHandler(async (req, res, next) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return next(new AppError("Invalid request. 'messages' array is required.", 400));
  }

  // 1. Fetch available products (store catalog)
  const products = await Product.find({}, "name price category description stock");

  // 2. Fetch user context if authenticated
  let cartData = null;
  let ordersData = [];
  if (req.user && req.user.id) {
    cartData = await Cart.findOne({ user: req.user.id }).populate("items.product", "name price category");
    ordersData = await Order.find({ user: req.user.id })
      .populate("items.product", "name price")
      .sort({ createdAt: -1 })
      .limit(5);
  }

  // 3. Format context strings for the LLM
  const productsContext = products.map(p => ({
    id: p._id,
    name: p.name,
    price: `$${p.price}`,
    category: p.category,
    description: p.description,
    stock: p.stock
  }));

  const userContext = req.user ? {
    isAuthenticated: true,
    userId: req.user.id,
    cart: cartData ? cartData.items.map(item => ({
      productId: item.product?._id,
      name: item.product?.name || "Unknown Product",
      price: item.product?.price ? `$${item.product.price}` : "N/A",
      quantity: item.quantity
    })) : [],
    recentOrders: ordersData.map(o => ({
      orderId: o._id,
      status: o.status,
      totalAmount: `$${o.totalAmount}`,
      paymentMethod: o.paymentMethod,
      date: o.createdAt,
      items: o.items.map(item => ({
        name: item.name,
        price: `$${item.price}`,
        quantity: item.quantity
      }))
    }))
  } : { isAuthenticated: false };

  // 4. Construct System Instruction
  const systemInstruction = `You are Lumina AI Assistant, the intelligent and helpful customer support chatbot for CloudCart, an e-commerce platform.
Your job is to assist customers browsing the store, answer product queries, suggest recommendations, explain platform features, and help track their orders or cart.

Here is the current real-time inventory of products in the store:
${JSON.stringify(productsContext, null, 2)}

Here is the logged-in customer's details and active context:
${JSON.stringify(userContext, null, 2)}

Strict Guidelines for responses:
1. Be polite, concise, professional, and friendly.
2. Recommend products ONLY from our active inventory listed above. Explain why they fit the user's needs.
3. If recommending a product, output a clickable markdown link using this format: [Product Name](/product/productId). E.g., "We recommend the [Gaming Laptop](/product/65d83f12a...) which costs $1200."
4. If the user asks about their cart and is logged in, summarize it. Suggest clicking [Go to Cart](/cart) or [Checkout](/checkout) if they are ready to purchase.
5. If the user asks about order status and is logged in, show their recent orders with their tracking status (placed, shipped, delivered) and order IDs.
6. If the user is NOT logged in and asks about orders, carts, or profile details, politely explain they need to [Login](/login) or [Register](/register) to access personalized features.
7. Use relative markdown links for store routes:
   - Browse shop: [Shop Products](/products)
   - Cart: [My Cart](/cart)
   - Split Expenses Tool: [Split Expenses](/expense)
   - Orders: [My Orders](/orders)
8. Format all pricing in USD ($). If information is not in the inventory list, politely state that we don't carry that item currently.`;

  // 5. Check if Gemini API Key is configured
  if (!env.GEMINI_API_KEY) {
    // 📴 OFFLINE DEMO MODE FALLBACK
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    let reply = "";

    if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi") || lastUserMessage.includes("hey")) {
      reply = `Hello! 👋 Welcome to CloudCart customer support. I am running in **Demo Mode** (Gemini API key is not configured on the server). 

How can I help you today? You can ask about our products, check your cart, or view order status!`;
    } else if (lastUserMessage.includes("product") || lastUserMessage.includes("shop") || lastUserMessage.includes("item") || lastUserMessage.includes("buy")) {
      if (productsContext.length === 0) {
        reply = `We currently have no products registered in our store catalog. Check back later or log in as an administrator to add some! \n\n[Shop Products](/products)`;
      } else {
        const list = productsContext.slice(0, 3).map(p => `- **${p.name}** (${p.price} | Category: ${p.category}) - [View details](/product/${p.id})`).join("\n");
        reply = `Here are some featured products from our catalog:\n\n${list}\n\n[Shop Products](/products)\n\n*(Note: Set the \`GEMINI_API_KEY\` in your \`.env\` file for full interactive AI conversations!)*`;
      }
    } else if (lastUserMessage.includes("cart") || lastUserMessage.includes("checkout")) {
      if (!req.user) {
        reply = `It looks like you are not logged in. Please [Login](/login) or [Register](/register) to view and manage your cart!`;
      } else if (!userContext.cart || userContext.cart.length === 0) {
        reply = `Your shopping cart is currently empty. You can browse products here: [Shop Products](/products).`;
      } else {
        const cartList = userContext.cart.map(i => `- ${i.name} (Qty: ${i.quantity} at ${i.price})`).join("\n");
        reply = `Here are the items in your cart:\n\n${cartList}\n\nReady to buy? Go to [My Cart](/cart) or proceed directly to [Checkout](/checkout).`;
      }
    } else if (lastUserMessage.includes("order") || lastUserMessage.includes("track")) {
      if (!req.user) {
        reply = `Please [Login](/login) to check your order status.`;
      } else if (userContext.recentOrders.length === 0) {
        reply = `You haven't placed any orders yet. Visit our [Shop Products](/products) to get started!`;
      } else {
        const orderList = userContext.recentOrders.map(o => `- Order **#${o.orderId.toString().slice(-6)}** on ${new Date(o.date).toLocaleDateString()} - Status: **${o.status.toUpperCase()}** - Total: ${o.totalAmount}`).join("\n");
        reply = `Here are your recent orders:\n\n${orderList}\n\nFor more details, check [My Orders](/orders).`;
      }
    } else if (lastUserMessage.includes("expense") || lastUserMessage.includes("split")) {
      reply = `You can split group shopping bills easily with our [Split Expenses](/expense) tool! Add items, group your friends, and track contributions.`;
    } else {
      reply = `Thanks for your inquiry! 

*Demo Mode Notice*: The \`GEMINI_API_KEY\` is not configured in the backend \`.env\` file, so I'm replying with pre-programmed support responses. 

To search the catalog, ask about: "products", "cart", "orders", or "expense".`;
    }

    return res.json({
      success: true,
      message: reply,
      isDemo: true
    });
  }

  // 6. ONLINE MODE (GEMINI API)
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    // Initialize the model with the system instructions
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Format chat history for Gemini API contents format:
    // { role: "user" | "model", parts: [{ text: "..." }] }
    // Note: Gemini requires alternating user/model turns, ending with user.
    const contents = [];
    
    // We filter and format the messages to fit Gemini API requirements
    const apiMessages = messages.slice(-10); // Keep last 10 turns to conserve token space
    
    for (const msg of apiMessages) {
      const role = msg.role === "assistant" ? "model" : "user";
      const text = msg.content || "";
      if (text.trim() === "") continue;

      // Ensure alternating roles by checking the last element
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        // Concatenate if roles are consecutive
        contents[contents.length - 1].parts[0].text += "\n" + text;
      } else {
        contents.push({
          role,
          parts: [{ text }]
        });
      }
    }

    // Ensure first message is user
    if (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    // Ensure last message is user (if we are sending a request, the user's latest query is at the end)
    if (contents.length > 0 && contents[contents.length - 1].role !== "user") {
      // If the last message is model, we pop it or append a dummy user turn
      contents.pop();
    }

    // If contents is empty, we just append a basic user prompt
    if (contents.length === 0) {
      const lastUserMsg = messages[messages.length - 1]?.content || "Hi";
      contents.push({
        role: "user",
        parts: [{ text: lastUserMsg }]
      });
    }

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const replyText = response.text();

    res.json({
      success: true,
      message: replyText,
      isDemo: false
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Graceful fallback to offline response if Gemini fails (e.g. rate limit, connection, bad api key)
    res.json({
      success: true,
      message: "I encountered an error communicating with my AI brain. Rest assured, our team is looking into it! Meanwhile, let me know if you need help viewing products or check back soon.",
      isDemo: true,
      error: error.message
    });
  }
});
