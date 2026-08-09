import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==============================
     FETCH ORDERS
  ============================== */
  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/my");
        if (mounted) {
          setOrders(res.data?.orders || []);
        }
      } catch (err) {
        console.error("Fetch orders error:", err);
        if (mounted) setError("Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      mounted = false;
    };
  }, []);

  /* ==============================
     NORMALIZE ORDERS (SAFE)
  ============================== */
  const safeOrders = useMemo(() => {
    return orders.map((order) => ({
      id: order._id,
      shortId: order._id.slice(-8).toUpperCase(),
      status: order.status || "placed",
      total: order.totalAmount || 0,
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "",
      items: (order.items || []).map((item, index) => ({
        key: item.product?._id || index,
        name: item.name || item.product?.name || "Product",
        quantity: item.quantity || 1,
        price: item.price || item.product?.price || 0,
        image: item.product?.image || null
      }))
    }));
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <span className="material-symbols-outlined text-6xl text-error">error</span>
        <h2 className="font-display text-2xl font-bold">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-[48px] py-16">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="font-display text-3xl font-semibold text-on-surface mb-1">Your Orders</h2>
          <p className="text-sm text-on-surface-variant">View and track your recent purchases</p>
        </div>
      </div>

      {safeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl premium-shadow border border-gray-100">
          <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4 block">receipt_long</span>
          <p className="text-lg text-on-surface-variant font-medium">No orders placed yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {safeOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-[24px] premium-shadow border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              
              {/* Header */}
              <div className="bg-surface-container-low px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="font-semibold text-sm">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Total</p>
                    <p className="font-semibold text-sm">₹{order.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Order #</p>
                    <p className="font-semibold text-sm" title={order.id}>{order.shortId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    order.status === "placed" ? "bg-emerald-100 text-emerald-700" :
                    order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="p-6">
                <div className="space-y-6">
                  {order.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-4 flex-grow">
                        <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-outline-variant/50">inventory_2</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">{item.name}</h4>
                          <p className="text-sm text-on-surface-variant">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold">₹{item.price * item.quantity}</span>
                        <p className="text-xs text-on-surface-variant">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
