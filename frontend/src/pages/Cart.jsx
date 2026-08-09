import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";

function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);

  const { data: rawItems = [], isLoading: loading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const res = await api.get("/cart");
        return res.data?.cart?.items || [];
      } catch (err) {
        console.error("Fetch cart error:", err);
        return [];
      }
    }
  });

  const cartItems = useMemo(() => {
    return rawItems
      .filter(item => item?.product?._id && typeof item.quantity === "number")
      .map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: Number(item.product.price) || 0,
        image: item.product.image,
        category: item.product.category,
        stock: item.product.stock || 0,
        quantity: Math.max(1, item.quantity)
      }));
  }, [rawItems]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + tax;

  const hasInsufficientStock = cartItems.some(item => item.quantity > item.stock);

  const removeMutation = useMutation({
    mutationFn: async (productId) => {
      setUpdatingId(productId);
      return api.delete("/cart/remove", { data: { productId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success("Item removed");
    },
    onError: () => {
      toast.error("Failed to remove item");
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, newQuantity }) => {
      setUpdatingId(productId);
      return api.put("/cart/update", { productId, quantity: newQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
    onError: () => {
      toast.error("Failed to update quantity");
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  const removeFromCart = (productId) => {
    removeMutation.mutate(productId);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ productId, newQuantity });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* ── Left: Cart Items ── */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-xl premium-shadow border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="font-display text-2xl font-semibold text-on-surface">
                Your Shopping Bag ({cartItems.length})
              </h2>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4 block">
                  shopping_cart
                </span>
                <p className="text-lg text-on-surface-variant">Your cart is empty</p>
                <button
                  onClick={() => navigate("/products")}
                  className="mt-4 bg-primary text-on-primary px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cartItems.map(item => (
                  <div
                    key={item.productId}
                    className="p-6 flex flex-col md:flex-row items-center gap-6 group hover:bg-surface-container-low transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface-container shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-outline-variant/40">inventory_2</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-on-surface">{item.name}</h3>
                      <p className="text-xs text-on-surface-variant mb-1">{item.category}</p>
                      {item.stock < item.quantity && (
                        <p className="text-xs font-bold text-error bg-error-container/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
                           <span className="material-symbols-outlined text-[14px]">error</span>
                           {item.stock === 0 ? "Out of Stock" : `Only ${item.stock} available`}
                        </p>
                      )}
                    </div>

                    {/* Quantity + Price + Delete */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center border border-outline-variant rounded-lg bg-surface-bright">
                        <button
                          className="p-2 hover:text-primary transition-colors material-symbols-outlined disabled:opacity-40"
                          disabled={updatingId === item.productId || item.quantity <= 1}
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          remove
                        </button>
                        <span className="px-4 text-sm font-bold text-on-surface">{item.quantity}</span>
                        <button
                          className="p-2 hover:text-primary transition-colors material-symbols-outlined disabled:opacity-40"
                          disabled={updatingId === item.productId || item.quantity >= item.stock}
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          add
                        </button>
                      </div>

                      <div className="w-28 text-right">
                        <span className="font-bold text-on-surface">₹{item.price * item.quantity}</span>
                      </div>

                      <button
                        className="material-symbols-outlined text-error p-2 hover:bg-error-container rounded-full transition-all opacity-0 group-hover:opacity-100"
                        disabled={updatingId === item.productId}
                        onClick={() => removeFromCart(item.productId)}
                      >
                        delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Right: Order Summary ── */}
        {cartItems.length > 0 && (
          <div className="lg:col-span-4">
            <div className="floating-summary bg-white rounded-xl premium-shadow border border-gray-100 p-6 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-on-surface mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Estimated Tax</span>
                  <span className="font-bold">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Shipping</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
              </div>

              <div className="h-px bg-outline-variant/30 my-4" />

              <div className="flex justify-between items-end mb-6">
                <span className="font-display text-xl font-semibold">Total</span>
                <span className="font-display text-2xl font-semibold text-primary">₹{total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                disabled={hasInsufficientStock}
                className="w-full py-4 rounded-xl text-lg font-bold text-on-primary bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:grayscale"
              >
                {hasInsufficientStock ? "Resolve Stock Issues" : "Proceed to Checkout"}
              </button>

              <p className="text-center text-xs text-on-surface-variant flex items-center justify-center gap-1 mt-2">
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

export default Cart;