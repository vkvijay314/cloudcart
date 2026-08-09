import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import useAuth from "../context/useAuth";

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/analytics/dashboard");
        setStats(res.data.stats);
      } catch (err) {
        console.error("Dashboard stats error:", err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* ── Sidebar Nav ── */}
      <aside className="lg:col-span-2 space-y-2">
        <div className="mb-8">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Admin Portal</span>
        </div>
        <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-container/10 text-primary font-bold">
          <span className="material-symbols-outlined">dashboard</span> Dashboard
        </Link>
        <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">inventory_2</span> Products
        </Link>
        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">receipt_long</span> Orders
        </Link>
      </aside>

      {/* ── Main Dashboard Area ── */}
      <div className="lg:col-span-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-on-surface">Overview</h1>
            <p className="text-sm text-on-surface-variant mt-1">Welcome back, Admin {user?.name}</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant/50 bg-white rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-all shadow-sm">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span> Last 30 Days
            </button>
            <Link to="/admin/products" className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-md hover:bg-primary-container transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span> Add Product
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Total Revenue</p>
            <h3 className="font-display text-2xl font-bold text-on-surface">₹{stats.revenue.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+5%</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Total Orders</p>
            <h3 className="font-display text-2xl font-bold text-on-surface">{stats.orders}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full">Active</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Total Products</p>
            <h3 className="font-display text-2xl font-bold text-on-surface">{stats.products}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined">group</span>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">+18%</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Total Users</p>
            <h3 className="font-display text-2xl font-bold text-on-surface">{stats.users}</h3>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full">Split</span>
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Total Expenses</p>
            <h3 className="font-display text-2xl font-bold text-on-surface">₹{stats.totalExpenseAmount.toLocaleString()}</h3>
          </div>

        </div>

        {/* Charts & Details section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Revenue Chart Placeholder */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">Revenue Growth</h3>
              <span className="material-symbols-outlined text-outline-variant">more_horiz</span>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 px-2">
              {[30, 45, 20, 60, 40, 80, 55, 75, 40, 90, 65, 100].map((h, i) => (
                <div key={i} className="w-full bg-primary-container/20 hover:bg-primary rounded-t-sm transition-colors cursor-pointer relative group" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    ₹{h * 100}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-on-surface-variant">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>

          {/* Activity Placeholder */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant/30 premium-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold">Recent Platform Activity</h3>
              <span className="material-symbols-outlined text-outline-variant">more_horiz</span>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_0_4px_rgba(70,72,212,0.1)]"></div>
                <div>
                  <p className="text-sm font-semibold">New Order #4829</p>
                  <p className="text-xs text-on-surface-variant mt-1">Order placed for ₹12,400 via Razorpay.</p>
                  <p className="text-xs text-outline mt-1">2 mins ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"></div>
                <div>
                  <p className="text-sm font-semibold">New User Registration</p>
                  <p className="text-xs text-on-surface-variant mt-1">Sarah joined CloudCart.</p>
                  <p className="text-xs text-outline mt-1">1 hour ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_0_4px_rgba(245,158,11,0.1)]"></div>
                <div>
                  <p className="text-sm font-semibold">Stock Alert</p>
                  <p className="text-xs text-on-surface-variant mt-1">Vision Pro Watch stock is below 5 units.</p>
                  <p className="text-xs text-outline mt-1">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
