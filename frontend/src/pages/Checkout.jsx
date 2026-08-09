import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";

function Checkout() {
  const navigate = useNavigate();
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);

  const [address, setAddress] = useState({ name: "", phone: "", line: "", city: "", pincode: "" });
  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get("/cart");
        setRawItems(res.data?.cart?.items || []);
      } catch (err) {
        console.error("Checkout cart error:", err);
        setRawItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const cartItems = useMemo(() => {
    return rawItems
      .filter(item => item?.product && item.quantity > 0)
      .map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        quantity: item.quantity
      }));
  }, [rawItems]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;

  const handleChange = (e) => setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const placeOrder = async () => {
    if (!address.name || !address.phone || !address.line || !address.city || !address.pincode) {
      toast.error("Please fill complete address");
      setStep(1);
      return;
    }
    try {
      setPlacing(true);
      await api.post("/orders", { address, paymentMethod: "COD" });
      toast.success("Order placed successfully!");
      setStep(4);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const payWithRazorpay = async () => {
    if (!address.name || !address.phone || !address.line || !address.city || !address.pincode) {
      toast.error("Please fill complete address");
      setStep(1);
      return;
    }
    try {
      setPlacing(true);
      const orderRes = await api.post("/payment/create", { amount: total });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.data.amount,
        currency: "INR",
        name: "CloudCart",
        description: "Order Payment",
        order_id: orderRes.data.id,
        handler: async (response) => {
          const verifyRes = await api.post("/payment/verify", response);
          if (verifyRes.data.success) {
            await api.post("/orders", { address, paymentMethod: "ONLINE" });
            toast.success("Payment successful, order placed!");
            setStep(4);
          } else {
            toast.error("Payment verification failed");
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Payment failed");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4">shopping_cart</span>
        <p className="text-lg text-on-surface-variant">Your cart is empty</p>
      </div>
    );
  }

  const stepLabels = ["Delivery", "Payment", "Review"];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* ── Left Column ── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-8">
            {stepLabels.map((label, i) => {
              const num = i + 1;
              const completed = num < step;
              const active = num === step;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      completed ? "bg-tertiary text-on-primary" :
                      active ? "bg-primary text-on-primary scale-110 ring-4 ring-primary/10" :
                      "bg-surface-container-high text-on-surface-variant"
                    }`}>
                      {completed ? <span className="material-symbols-outlined">check</span> : num}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-primary" : "text-on-surface-variant"}`}>
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-grow h-px mx-4 mt-[-20px] ${completed ? "bg-tertiary" : "bg-outline-variant"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Cart Items Summary */}
          <section className="bg-white rounded-xl premium-shadow border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <h2 className="font-display text-xl font-semibold">Your Items ({cartItems.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {cartItems.map(item => (
                <div key={item.productId} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-outline-variant/40">inventory_2</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-on-surface-variant">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-sm">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Step 1: Delivery */}
          {step === 1 && (
            <section className="bg-white rounded-xl premium-shadow border border-gray-100 p-6 space-y-6 step-transition">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h2 className="font-display text-xl font-semibold">Delivery Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Full Name</label>
                  <input name="name" value={address.name} onChange={handleChange} placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Phone Number</label>
                  <input name="phone" value={address.phone} onChange={handleChange} placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Shipping Address</label>
                  <textarea name="line" value={address.line} onChange={handleChange} placeholder="Street name, apartment, building..." rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">City</label>
                  <input name="city" value={address.city} onChange={handleChange} placeholder="Mumbai"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">PIN Code</label>
                  <input name="pincode" value={address.pincode} onChange={handleChange} placeholder="400001"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                </div>
              </div>
              <button onClick={() => setStep(2)}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2">
                Continue to Payment <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </section>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <section className="bg-white rounded-xl premium-shadow border border-gray-100 p-6 space-y-6 step-transition">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">payments</span>
                <h2 className="font-display text-xl font-semibold">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer hover:bg-surface-container transition-all ${
                  paymentMethod === "ONLINE" ? "border-primary bg-primary-container/10" : "border-outline-variant"
                }`}>
                  <input type="radio" name="payment" value="ONLINE" checked={paymentMethod === "ONLINE"} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  <span className="material-symbols-outlined text-primary mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  <span className="font-bold">Razorpay</span>
                  <span className="text-xs text-on-surface-variant">UPI, Net Banking, Cards</span>
                </label>
                <label className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer hover:bg-surface-container transition-all ${
                  paymentMethod === "COD" ? "border-primary bg-primary-container/10" : "border-outline-variant"
                }`}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                  <span className="material-symbols-outlined text-primary mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                  <span className="font-bold">Cash on Delivery</span>
                  <span className="text-xs text-on-surface-variant">Pay when delivered</span>
                </label>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="px-8 py-4 rounded-xl font-bold border border-outline-variant hover:bg-surface-container transition-all">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold hover:bg-primary-container transition-all active:scale-95">
                  Review Order
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <section className="bg-white rounded-xl premium-shadow border border-gray-100 p-6 space-y-6 step-transition">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                <h2 className="font-display text-xl font-semibold">Final Review</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase">Shipping To</span>
                    <button onClick={() => setStep(1)} className="material-symbols-outlined text-primary text-lg">edit</button>
                  </div>
                  <p className="font-bold">{address.name}</p>
                  <p className="text-sm text-on-surface-variant">{address.line}<br />{address.city}, {address.pincode}</p>
                  <p className="text-sm text-on-surface-variant">{address.phone}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant uppercase">Payment</span>
                    <button onClick={() => setStep(2)} className="material-symbols-outlined text-primary text-lg">edit</button>
                  </div>
                  <p className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">
                      {paymentMethod === "COD" ? "handshake" : "account_balance_wallet"}
                    </span>
                    {paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay (Online)"}
                  </p>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="px-8 py-4 rounded-xl font-bold border border-outline-variant hover:bg-surface-container transition-all">
                Back
              </button>
            </section>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <section className="bg-white rounded-xl premium-shadow border border-gray-100 p-10 flex flex-col items-center justify-center text-center space-y-6 step-transition">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-on-surface">Order Confirmed!</h2>
              <p className="text-on-surface-variant max-w-sm">
                Your order has been placed successfully. You can track its status in the orders page.
              </p>
              
              <div className="w-full max-w-md bg-surface-bright border border-outline-variant/30 rounded-xl p-6 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined">receipt_long</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold">Split this bill?</h4>
                    <p className="text-xs text-on-surface-variant">Bought something for the team or roommates?</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/expense", { state: { amount: total } })}
                  className="w-full py-3 bg-secondary text-white rounded-lg font-bold hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm"
                >
                  Split ₹{total.toFixed(2)} Expense
                </button>
              </div>

              <div className="flex gap-4 w-full max-w-md mt-6">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 py-3 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate("/orders")}
                  className="flex-1 py-3 border border-outline-variant rounded-lg font-semibold hover:bg-surface-container transition-colors"
                >
                  View Orders
                </button>
              </div>
            </section>
          )}
        </div>

        {/* ── Right: Order Summary ── */}
        {step !== 4 && (
          <div className="lg:col-span-4">
            <div className="floating-summary bg-white rounded-xl premium-shadow border border-gray-100 p-6 space-y-4">
              <h2 className="font-display text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Subtotal</span><span className="font-bold">₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Tax</span><span className="font-bold">₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Shipping</span><span className="text-green-600 font-bold">Free</span></div>
              </div>
              <div className="h-px bg-outline-variant/30 my-4" />
              <div className="flex justify-between items-end mb-6">
                <span className="font-display text-lg font-semibold">Total</span>
                <span className="font-display text-2xl font-semibold text-primary">₹{total.toFixed(2)}</span>
              </div>
  
              <button
                disabled={placing}
                onClick={() => paymentMethod === "COD" ? placeOrder() : payWithRazorpay()}
                className="w-full py-5 rounded-xl text-lg font-bold text-on-primary bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
              >
                {placing ? "Processing..." : step === 3 ? "Complete Purchase" : "Pay Now"}
              </button>
  
              <p className="text-center text-xs text-on-surface-variant flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Secure checkout powered by CloudCart
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;
